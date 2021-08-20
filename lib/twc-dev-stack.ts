import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/lib/aws-ec2';
import { Construct } from 'constructs';


//
// TWC Dev environment
//
export class TwcDevStack extends cdk.Stack {

    private vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props?: cdk.StackProps ) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, 'dev-vpc', {
            cidr: '10.0.0.0/16',
            maxAzs: 2,
            natGateways: 1,     
            subnetConfiguration: [
                {   // public subnet for ALB (note ALB must point at 2 public subnets in different AZs)
                    name: 'sn-pub',
                    subnetType: ec2.SubnetType.PUBLIC,
                    cidrMask: 24
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


    }
}