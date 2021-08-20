import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/lib/aws-ec2';
import * as rds from 'aws-cdk-lib/lib/aws-rds';
import { InstanceArchitecture, InstanceType, SecurityGroup, SubnetFilter, SubnetType } from 'aws-cdk-lib/lib/aws-ec2';
import { RDS_LOWERCASE_DB_IDENTIFIER } from 'aws-cdk-lib/lib/cx-api';
import { Construct } from 'constructs';
import { DatabaseInstanceEngine, SqlServerEngineVersion } from 'aws-cdk-lib/lib/aws-rds';


//
// TWC Dev environment
//
export class TwcDevStack extends cdk.Stack {

    private vpc: ec2.Vpc;
    private securityGroups: Array<ec2.SecurityGroup>;

    constructor(scope: Construct, id: string, props?: cdk.StackProps ) {
        super(scope, id, props);

        this.securityGroups = new Array<ec2.SecurityGroup>();

        this.vpc = new ec2.Vpc(this, 'dev-vpc', {
            cidr: '10.0.0.0/16',
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
                    name: 'sn-priv-db',
                    subnetType: ec2.SubnetType.PRIVATE,
                    cidrMask: 24
                }
            ]
        });

        this.CreateSecurityGroups();
        this.LaunchInstances();
    }

    private CreateSecurityGroups(): void {
        let sgPublic = new ec2.SecurityGroup(this, 'twc-dev-sg-public' , {
            vpc: this.vpc,
            description: 'Allow all inbound HTTP/HTTPS',
            allowAllOutbound: true
        });
        sgPublic.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
        sgPublic.connections.allowFromAnyIpv4(ec2.Port.tcp(443));

        this.securityGroups.push(sgPublic);

        let sgAppPrivate = new ec2.SecurityGroup(this, 'twc-dev-sg-priv-app', {
            vpc: this.vpc,
            description: 'Allow HTTP/HTTPS only from sgPublic',
            allowAllOutbound: true

        });
        sgAppPrivate.connections.allowFrom(sgPublic, ec2.Port.tcp(80), 'Allow HTTP only from the public security group (ALB)');
        sgAppPrivate.connections.allowFrom(sgPublic, ec2.Port.tcp(443), 'Allow HTTPS only from the public security group (ALB)')

        this.securityGroups.push(sgAppPrivate);

        let sgAppDb = new SecurityGroup(this, 'twc-dev-sg-priv-db', {
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
    // In the Dev stack you will not have auto scaling so 
    private LaunchInstances(): void {

        let appserver = new ec2.Instance(this, 'twc-dev-appserver', {
            vpc: this.vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.M4, ec2.InstanceSize.LARGE),
            machineImage: ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2012_R2_RTM_ENGLISH_64BIT_HYPERV),
            securityGroup: this.GetAppSecurityGroup(),
            vpcSubnets: this.vpc.selectSubnets( {subnetGroupName: 'sn-priv-app', availabilityZones: [this.vpc.availabilityZones[0]] }),
            keyName: 
        });

        let dbserver = new rds.DatabaseInstance(this, 'twc-dev-dbserver', {
            vpc: this.vpc,
            vpcSubnets: this.vpc.selectSubnets( {subnetGroupName: 'sn-priv-db', availabilityZones: [this.vpc.availabilityZones[0]] }),
            engine: rds.DatabaseInstanceEngine.sqlServerSe({ version: rds.SqlServerEngineVersion.VER_15_00_4043_23_V1 }),
            instanceType: ec2.InstanceType.of( ec2.InstanceClass.M4, ec2.InstanceSize.LARGE),


        });
    }
}
