import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TwcDevStack } from './twc-dev-stack';
import { TwcValidateStack } from './twc-valid-stack';
import { TwcProdStack } from './twc-prod-stack';

export class TrackwiseClassicOnAwsStack extends cdk.Stack {

  private devstack: TwcDevStack;
  private validstack: TwcValidateStack;
  private prodstack: TwcProdStack;

  constructor(scope: Construct, id: string, twenv: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    switch (twenv) {
      case 'dev':
        this.devstack = new TwcDevStack(this, 'twc-dev-stack', props);
        break;
      case 'validate':
        this.validstack = new TwcValidateStack(this, 'twc-validate-stack', props);
        break;
      case 'prod':
        this.prodstack = new TwcProdStack(this, 'twc-production-stack', props);
        break;
      case 'all':
        this.devstack = new TwcDevStack(this, 'twc-dev-stack', props);
        this.validstack = new TwcValidateStack(this, 'twc-validate-stack', props);
        this.prodstack = new TwcProdStack(this, 'twc-production-stack', props);
        break;
    }
  }
}
