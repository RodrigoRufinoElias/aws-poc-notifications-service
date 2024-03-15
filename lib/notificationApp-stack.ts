import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

export class NotificationAppStack extends cdk.Stack {
  readonly notificationsHandler: lambdaNodeJS.NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tópico SNS
    const notificationsTopic = new sns.Topic(this, "NotificationsTopic", {
      displayName: "Notifications topic",
      topicName: "notifications-topic",
    });

    this.notificationsHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "NotificationsFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        functionName: "NotificationsFunction",
        entry: "lambda/notifications/notificationsFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        environment: {
          // Necessário passar o ARN do tópico para publicar mensagens
          NOTIFICATIONS_TOPIC_ARN: notificationsTopic.topicArn,
        },
        // Habilita o log Tracing das funções lambda pelo XRay.
        tracing: lambda.Tracing.ACTIVE,
        // Habilita o Lambda Insight
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
      }
    );

    // Dar permissão ao "notificationsHandler" para publicar mensagens no tópico "notificationsTopic"
    notificationsTopic.grantPublish(this.notificationsHandler);

    // Lambda será invocada pelo tópico "notificationsTopic"
    const notificationsConsumerHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "NotificationsConsumerFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        functionName: "NotificationsConsumerFunction",
        entry: "lambda/notifications/notificationsConsumerFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(5),
        bundling: {
          minify: true,
          sourceMap: false,
        },
        // Habilita o log Tracing das funções lambda pelo XRay.
        tracing: lambda.Tracing.ACTIVE,
        // Habilita o Lambda Insight
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
      }
    );

    // Inscrição da função lambda no tópico
    notificationsTopic.addSubscription(
      new subs.LambdaSubscription(notificationsConsumerHandler)
    );
  }
}
