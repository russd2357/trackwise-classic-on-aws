import * as cdk from 'aws-cdk-lib';
import * as TrackwiseClassicOnAws from '../lib/trackwise-classic-on-aws-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TrackwiseClassicOnAws.TrackwiseClassicOnAwsStack(app, 'MyTestStack');
    // THEN
    const actual = app.synth().getStackArtifact(stack.artifactId).template;
    expect(actual.Resources ?? {}).toEqual({});
});
