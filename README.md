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
