import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';


//
// This stack is used to stand up the TWC Production environment.
//
//
export class TwcProdStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps ){
        super(scope, id, props);



    }
}