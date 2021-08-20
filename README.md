# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


 # Prerequisites

 You should configure Host Management for AWS Systems Manager so that an IAM role is created to allow
 access to your EC2 instances on private subnets. Otherwise you will have to add a bastion host in a public subnet to reach them which will add to your deployment cost.

 For more information on AWS Systems Manager Host Management, see https://docs.aws.amazon.com/systems-manager/latest/userguide/quick-setup-host-management.html

 You will need to create a private key file for the EC2 instances in each environment. The keys should follow this naming convention: twc-<env>-key. Be careful - if you deploy these stacks in multiple regions, you will need to declare a key in each region.

