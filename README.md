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


 # Notes

 You should configure Host Management for AWS Systems Manager so that an IAM role is created to allow
 access to your EC2 instances on private subnets. Otherwise you will have to add a bastion host in a public subnet to reach them which will add to your deployment cost.

 For more information on AWS Systems Manager Host Management, see https://docs.aws.amazon.com/systems-manager/latest/userguide/quick-setup-host-management.html

 You will need to create a private key file for the EC2 instances in each environment.  Note - if you deploy these stacks in multiple regions, you will need to declare the keys in each region so you will have to designate the region on them if you download them, but if you're using AWS Systems Manager, you shouldn't need to. The naming convention for the keys is: 

 twc-<env>-key  where <env> is dev, validate, prod

 You can control which environment you stand up setting the environment variable TW_ENV to either 'dev', 'validate', 'prod', or 'all'.


 

