import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSource from "aws-cdk-lib/aws-lambda-event-sources";
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

    // Lambda que publica a notificação no tópico do SNS
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

    // Fila SQS
    const notificationsQueue = new sqs.Queue(this, "NotificationsQueue", {
      queueName: "NotificationsQueue",
      enforceSSL: false,
      encryption: sqs.QueueEncryption.UNENCRYPTED,
    });

    // Inscrição da fila SQS no tópico
    notificationsTopic.addSubscription(
      new subs.SqsSubscription(notificationsQueue)
    );

    // Lambda que envia email será invocada pela fila do SQS "notificationsQueue"
    const notificationEmailsHandler = new lambdaNodeJS.NodejsFunction(
      this,
      "NotificationEmailsHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        functionName: "NotificationEmailsHandler",
        entry: "lambda/notifications/notificationEmailsHandler.ts",
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

    // Diz que a fonte de eventos p/ acionar o "notificationEmailsHandler" é a fila SQS "notificationsQueue"
    notificationEmailsHandler.addEventSource(
      new lambdaEventSource.SqsEventSource(notificationsQueue, {
        // É possível consumir a fila em lotes com as configurações abaixo.
        // Pode ser necessário visto que o SQS é cobrado por chamada, não por msg.
        // No caso abaixo a fila aguarda acumular 5 msgs ou 1 minuto desde a primeira msg acumulada
        batchSize: 5,
        maxBatchingWindow: cdk.Duration.minutes(1),
        enabled: true,
      })
    );

    // Permissão para o lambda "notificationEmailsHandler" consumir mensagens da fila SQS "notificationsQueue"
    notificationsQueue.grantConsumeMessages(notificationEmailsHandler);
  }
}
