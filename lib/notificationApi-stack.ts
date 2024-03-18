import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cwlogs from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface NotificationApiStackProps extends cdk.StackProps {
  notificationsHandler: lambdaNodeJS.NodejsFunction;
}

export class NotificationApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NotificationApiStackProps) {
    super(scope, id, props);

    const logGroup = new cwlogs.LogGroup(this, "NotificationsAPILogs");

    const api = new apigateway.RestApi(this, "NotificationsAPI", {
      restApiName: "NotificationsAPI",
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true,
        }),
      },
    });

    const notificationsIntegration = new apigateway.LambdaIntegration(
      props.notificationsHandler
    );

    const notificationsResource = api.root.addResource("notifications");

    notificationsResource.addMethod("POST", notificationsIntegration);
  }
}
