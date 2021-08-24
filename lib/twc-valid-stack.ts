import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/lib/aws-ec2';
import * as rds from 'aws-cdk-lib/lib/aws-rds';
import { InstanceArchitecture, InstanceType, SecurityGroup, SubnetFilter, SubnetType } from 'aws-cdk-lib/lib/aws-ec2';
import { RDS_LOWERCASE_DB_IDENTIFIER } from 'aws-cdk-lib/lib/cx-api';
import { Construct } from 'constructs';
import { DatabaseInstanceEngine, SqlServerEngineVersion } from 'aws-cdk-lib/lib/aws-rds';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/lib/aws-iam';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/lib/aws-elasticloadbalancingv2';
import { AutoScalingGroup } from 'aws-cdk-lib/lib/aws-autoscaling';


//
// This stack is used to stand up the TWC Validation environment.
//
//
export class TwcValidateStack extends cdk.Stack {

    private vpc: ec2.Vpc;
    private securityGroups: Array<ec2.SecurityGroup>;
    private ssmrole: Role;

    constructor(scope: Construct, id: string, props?: cdk.StackProps ) {
        super(scope, id, props);

        this.securityGroups = new Array<ec2.SecurityGroup>();

        this.vpc = new ec2.Vpc(this, 'valaidate-vpc', {
            cidr: '10.1.0.0/16',
            maxAzs: 2,
            natGateways: 1,     
            subnetConfiguration: [
                {   // public subnet for ALB (note ALB must point at 2 public subnets in different AZs)
                    name: 'sn-pub',
                    subnetType: ec2.SubnetType.PUBLIC,
                    cidrMask: 24,
                },
                {   // private subnet for app server
                    name: 'sn-priv-app',
                    subnetType: ec2.SubnetType.PRIVATE,
                    cidrMask: 24
                },
                {   // private subnet for db server
                    // TODO - experiment with ISOLATED 
                    name: 'sn-priv-db',
                    subnetType: ec2.SubnetType.PRIVATE,
                    cidrMask: 24
                }
            ]
        });

        this.ssmrole = new Role(this, 'twc-validate-ssmrole', {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            description: 'Role used for System Manager Managed Instances',
            managedPolicies: [ ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore') ]
        });

        this.CreateSecurityGroups();
        this.LaunchFrontend();
        this.LaunchInstances();
    }

    private CreateSecurityGroups(): void {
        let sgPublic = new ec2.SecurityGroup(this, 'twc-validate-sg-public' , {
            vpc: this.vpc,
            description: 'Allow all inbound HTTP/HTTPS',
            allowAllOutbound: true
        });
        sgPublic.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
        sgPublic.connections.allowFromAnyIpv4(ec2.Port.tcp(443));

        this.securityGroups.push(sgPublic);

        let sgAppPrivate = new ec2.SecurityGroup(this, 'twc-validate-sg-priv-app', {
            vpc: this.vpc,
            description: 'Allow HTTP/HTTPS only from sgPublic',
            allowAllOutbound: true

        });
        sgAppPrivate.connections.allowFrom(sgPublic, ec2.Port.tcp(80), 'Allow HTTP only from the public security group (ALB)');
        sgAppPrivate.connections.allowFrom(sgPublic, ec2.Port.tcp(443), 'Allow HTTPS only from the public security group (ALB)')

        this.securityGroups.push(sgAppPrivate);

        let sgAppDb = new ec2.SecurityGroup(this, 'twc-validate-sg-priv-db', {
            vpc: this.vpc,
            description: 'Allow database connections only from sgAppPrivate',
            allowAllOutbound: true

        });
        sgAppPrivate.connections.allowFrom(sgAppPrivate, ec2.Port.tcp(80), 'Allow HTTP only from the private app security group (ALB)');
        sgAppPrivate.connections.allowFrom(sgAppPrivate, ec2.Port.tcp(443), 'Allow HTTP only from the private app security group (ALB)');
        sgAppPrivate.connections.allowFrom(sgAppPrivate, ec2.Port.tcp(1433), 'Allow SQL only from the private app security group (ALB)')
    }

    private GetAppSecurityGroup(): ec2.SecurityGroup {
        return this.securityGroups[1];
    }

    //
    // In the Validate stack this launches the database and QualityView servers 
    private LaunchInstances(): void {

        let dbserver = new rds.DatabaseInstance(this, 'twc-validate-dbserver', {
            vpc: this.vpc,
            vpcSubnets: this.vpc.selectSubnets( {subnetGroupName: 'sn-priv-db', availabilityZones: [this.vpc.availabilityZones[0]] }),
            engine: rds.DatabaseInstanceEngine.sqlServerSe({ version: rds.SqlServerEngineVersion.VER_15_00_4043_23_V1 }),
            instanceType: ec2.InstanceType.of( ec2.InstanceClass.M4, ec2.InstanceSize.LARGE),
            credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
            multiAz: true,
        });

        let qvappserver = new ec2.Instance(this, 'twc-validate-qv-appserver', {
            vpc: this.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.M4, ec2.InstanceSize.LARGE),
            machineImage: ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2012_R2_RTM_ENGLISH_64BIT_HYPERV),
            securityGroup: this.GetAppSecurityGroup(),
            vpcSubnets: this.vpc.selectSubnets( {subnetGroupName: 'sn-priv-app', availabilityZones: [this.vpc.availabilityZones[0]] }),
            keyName: 'twc-validate-key',
            role: this.ssmrole
        });
    }

    private LaunchFrontend() {
        let alb = new ApplicationLoadBalancer(this, 'twc-validate-alb', {
            vpc: this.vpc,
            vpcSubnets: this.vpc.selectSubnets({ subnetGroupName: 'sn-priv-app'}),
            internetFacing: true,
            loadBalancerName: 'twc-validate-alb',
        })

        let asg = new AutoScalingGroup(this, 'twc-validate-asg', {
            vpc: this.vpc,
            vpcSubnets: this.vpc.selectSubnets({subnetGroupName: 'sn-priv-app'}),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.M4, ec2.InstanceSize.LARGE),
            machineImage: ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2012_R2_RTM_ENGLISH_64BIT_HYPERV),
            securityGroup: this.GetAppSecurityGroup(),
            role: this.ssmrole,
            minCapacity: 2,
            maxCapacity: 10
        })
    }
}