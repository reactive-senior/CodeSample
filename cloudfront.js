const { api } = require("actionhero");
const uuidv4 = require("uuid/v4");
const AWS = require("aws-sdk");
const { Op } = require("sequelize");
const urlResolver = require("url");

const getListOfletiationsofURLToSearchInDB = url => {
  const listletiations = [];
  listletiations.push(url);
  if (url.startsWith("http://")) {
    listletiations.push(`https://${url.substring(7)}`);
  } else if (url.startsWith("https://")) {
    listletiations.push(`http://${url.substring(8)}`);
  }
  return listletiations;
};

exports.CloudFrontCDN = class CloudFrontCDN {
  constructor() {
    this.cloudfront = new AWS.CloudFront({
      region: api.config.aws.region
    });
  }

  async createCDN(userObj, origin, websiteId, defaultCacheTime, assetsEnabled) {
    const user = await api.models.User.find({ where: { id: userObj.id } });
    if (user === null) {
      const error = {
        code: 105,
        description: "Error fetching user",
        parameter: "user"
      };
      return error;
    } else if (user.verified === true) {
      const distributionObj = await api.models.Distribution.findAll({
        where: {
          userId: userObj.id,
          status: {
            [Op.and]: [
              {
                [Op.ne]: "deleted"
              },
              {
                [Op.ne]: "deletion in progress"
              }
            ]
          }
        }
      });
      if (distributionObj.length >= userObj.Plan.max_distributions) {
        const error = {
          code: 102,
          description: "Distribution limit reached",
          parameter: "max_distributions"
        };
        return error;
      }
      if (!origin.endsWith("/")) origin += "/";

      if (!origin.startsWith("http")) {
        origin = `http://${origin}`;
      }

      const distributionUUID = uuidv4();
      const originServer = api.config.aws.loadBalancerName;
      const callerreferenceUsed = uuidv4();
      const params = {
        DistributionConfig: {
          CallerReference: callerreferenceUsed,
          Comment: `created by api v7 from website for url ${origin}`,
          DefaultCacheBehavior: {
            ForwardedValues: {
              Cookies: {
                Forward: "none",
                WhitelistedNames: {
                  Quantity: 0
                }
              },
              QueryString: !0,
              Headers: {
                Quantity: 6,
                Items: [
                  "Accept",
                  "Dex-Viewport-Width",
                  "CloudFront-Is-Desktop-Viewer",
                  "CloudFront-Is-Mobile-Viewer",
                  "Dex-Accept-Encoding",
                  "Host"
                ]
              }
            },
            MinTTL: 10,
            DefaultTTL: 86400,
            TargetOriginId: "dex-origin-v6",
            TrustedSigners: {
              Enabled: !1,
              Quantity: 0
            },
            ViewerProtocolPolicy: "allow-all",
            AllowedMethods: {
              Items: ["GET", "HEAD", "OPTIONS"],
              Quantity: 3,
              CachedMethods: {
                Items: ["GET", "HEAD", "OPTIONS"],
                Quantity: 3
              }
            },
            Compress: !1,
            SmoothStreaming: !1
          },
          Enabled: !0,
          Origins: {
            Quantity: 1,
            Items: [
              {
                DomainName: originServer,
                Id: "dex-origin-v6",
                CustomOriginConfig: {
                  HTTPPort: 80,
                  HTTPSPort: 443,
                  OriginProtocolPolicy: "http-only",
                  OriginSslProtocols: {
                    Items: ["TLSv1", "TLSv1.1", "TLSv1.2"],
                    Quantity: 3
                  }
                }
              }
            ]
          },
          Aliases: {
            Quantity: 0
          },
          CacheBehaviors: {
            Quantity: 2,
            Items: [
              {
                ForwardedValues: {
                  Cookies: {
                    Forward: "none",
                    WhitelistedNames: {
                      Quantity: 0
                    }
                  },
                  QueryString: !0,
                  Headers: {
                    Quantity: 6,
                    Items: [
                      "Accept",
                      "Dex-Viewport-Width",
                      "CloudFront-Is-Desktop-Viewer",
                      "CloudFront-Is-Mobile-Viewer",
                      "Dex-Accept-Encoding",
                      "Host"
                    ]
                  }
                },
                MinTTL: 10,
                DefaultTTL: 86400,
                PathPattern: "*.js",
                TargetOriginId: "dex-origin-v6",
                TrustedSigners: {
                  Enabled: !1,
                  Quantity: 0
                },
                ViewerProtocolPolicy: "allow-all",
                AllowedMethods: {
                  Items: ["GET", "HEAD", "OPTIONS"],
                  Quantity: 3,
                  CachedMethods: {
                    Items: ["GET", "HEAD", "OPTIONS"],
                    Quantity: 3
                  }
                },
                Compress: !1,
                LambdaFunctionAssociations: {
                  Quantity: 1,
                  Items: [
                    {
                      EventType: "viewer-request",
                      LambdaFunctionARN: api.config.general.developmentMode
                        ? "arn:aws:lambda:us-east-1:130238634661:function:add-dex-accept-encoding-br:1"
                        : "arn:aws:lambda:us-east-1:183312496655:function:add-dex-accept-encoding-br:12"
                    }
                  ]
                },
                SmoothStreaming: !1
              },
              {
                ForwardedValues: {
                  Cookies: {
                    Forward: "none",
                    WhitelistedNames: {
                      Quantity: 0
                    }
                  },
                  QueryString: !0,
                  Headers: {
                    Quantity: 6,
                    Items: [
                      "Accept",
                      "Dex-Viewport-Width",
                      "CloudFront-Is-Desktop-Viewer",
                      "CloudFront-Is-Mobile-Viewer",
                      "Dex-Accept-Encoding",
                      "Host"
                    ]
                  }
                },
                MinTTL: 10,
                DefaultTTL: 86400,
                PathPattern: "*.css",
                TargetOriginId: "dex-origin-v6",
                TrustedSigners: {
                  Enabled: !1,
                  Quantity: 0
                },
                ViewerProtocolPolicy: "allow-all",
                AllowedMethods: {
                  Items: ["GET", "HEAD", "OPTIONS"],
                  Quantity: 3,
                  CachedMethods: {
                    Items: ["GET", "HEAD", "OPTIONS"],
                    Quantity: 3
                  }
                },
                Compress: !1,
                LambdaFunctionAssociations: {
                  Quantity: 1,
                  Items: [
                    {
                      EventType: "viewer-request",
                      LambdaFunctionARN: api.config.general.developmentMode
                        ? "arn:aws:lambda:us-east-1:130238634661:function:add-dex-accept-encoding-br:1"
                        : "arn:aws:lambda:us-east-1:183312496655:function:add-dex-accept-encoding-br:11"
                    }
                  ]
                },
                SmoothStreaming: !1
              }
            ]
          },
          CustomErrorResponses: {
            Quantity: 2,
            Items: [
              {
                ErrorCode: 400,
                ErrorCachingMinTTL: 3,
                ResponsePagePath: "",
                ResponseCode: ""
              },
              {
                ErrorCode: 404,
                ErrorCachingMinTTL: 3,
                ResponsePagePath: "",
                ResponseCode: ""
              }
            ]
          },
          Logging: {
            Enabled: !0,
            IncludeCookies: !1,
            Bucket: api.config.aws.logBucketName,
            Prefix: distributionUUID
          },
          Restrictions: {
            GeoRestriction: {
              Quantity: 0,
              RestrictionType: "none"
            }
          },
          ViewerCertificate: {
            CloudFrontDefaultCertificate: !0,
            MinimumProtocolVersion: "TLSv1",
            SSLSupportMethod: "sni-only"
          }
        }
      };

      try {
        const data = await this.cloudfront.createDistribution(params).promise();
        const dynamodb = new AWS.DynamoDB({
          region: api.config.aws.region
        });
        try {
          const params = {
            TableName: api.config.aws.dynamoDBMasterTableName,
            Item: {
              host: { S: data.Distribution.DomainName },
              origin: { S: origin },
              version: { N: "1" },
              defaultCacheTime: { N: "86400" },
              jsEnabled: { BOOL: assetsEnabled.jsEnabled },
              cssEnabled: { BOOL: assetsEnabled.cssEnabled },
              imageEnabled: { BOOL: assetsEnabled.imageEnabled }
            }
          };
          await dynamodb.putItem(params).promise();
          console.log(
            `Successfully added host ${
              data.Distribution.DomainName
            } and version 1 to table ${
              api.config.aws.dynamoDBMasterTableName
            }: `,
            data
          );
          const _distributionObj = await api.models.Distribution.create({
            id: distributionUUID,
            origin,
            name: data.Distribution.DomainName,
            type: "CloudFront",
            distributionID: data.Distribution.Id,
            usage: 0,
            status: "enabled",
            websiteId,
            defaultCacheTime,
            jsEnabled: assetsEnabled.jsEnabled,
            cssEnabled: assetsEnabled.cssEnabled,
            imageEnabled: assetsEnabled.imageEnabled
          });
          userObj.addDistribution(_distributionObj.id);
          return null;
        } catch (ddbError) {
          console.error(
            `Error while adding version 1 to host ${
              data.Distribution.DomainName
            } in table ${api.config.aws.dynamoDBMasterTableName}: `,
            ddbError
          );
          const error = {
            code: 171369,
            description: `Error occured while adding version 1 to host ${
              data.Distribution.DomainName
            } in table ${api.config.aws.dynamoDBMasterTableName}`,
            parameter: "DynamoDB",
            error: ddbError
          };
          return error;
        }
      } catch (distError) {
        console.log(distError);
        const error = {
          code: 103,
          description: "Distribution not added",
          parameter: "Distribution"
        };
        return error;
      }
    } else {
      // user.verfied === false
      const error = {
        code: 104,
        description: "User is not verfied and Distribution not added",
        parameter: "Distribution"
      };
      return error;
    }
  }

  async clearCDN(distribution, url) {
    const originFromRDS = distribution.dataValues.origin;
    if (!distribution) {
      const error = {
        code: 102,
        description: "Distribution not found",
        parameter: "Distribution"
      };
      return error;
    }
    let owned_url = [];
    try {
      url = JSON.parse(url);
      owned_url = url;
    } catch (err) {
      owned_url = url.split(",");
    }
    console.log(owned_url);
    if (url instanceof Array && url.length === 1 && url[0] === "/*") {
      const dynamodb = new AWS.DynamoDB({
        region: api.config.aws.region
      });
      try {
        let params = {
          TableName: api.config.aws.dynamoDBMasterTableName,
          Key: {
            host: {
              S: distribution.name
            }
          }
        };
        const data = await dynamodb.getItem(params).promise();
        if (!data.Item) {
          console.error("Error", "No item in the table");
          const error = {
            code: 700148,
            description: `Error occured while getting item with host ${
              distribution.name
            } from table ${api.config.aws.dynamoDBMasterTableName}`,
            parameter: "DynamoDB",
            error: "No item in the table"
          };
          return error;
        }
        const currentVersion = parseInt(data.Item.version.N);
        const newVersion = currentVersion + 1;

        params = {
          TableName: api.config.aws.dynamoDBMasterTableName,
          Key: {
            host: {
              S: distribution.name
            }
          },
          UpdateExpression: `set version = :version`,
          ExpressionAttributeValues: {
            ":version": { N: newVersion.toString() }
          }
        };
        // blah
        await dynamodb.updateItem(params).promise();
      } catch (err) {
        console.error("Error", err);
        const error = {
          code: 700148,
          description: `Error occured while getting item with host ${
            distribution.name
          } from table ${config.aws.dynamoDBMasterTableName}`,
          parameter: "DynamoDB",
          error: err
        };
        return err;
      }
    } else {
      // if clear by url remove urls from item ddb
      const urlToRemove = [];
      owned_url.every(url => {
        urlToRemove.push(urlResolver.resolve(originFromRDS, url));
        return true;
      });
      AWS.config.update({
        region: api.config.aws.region,
        endpoint: "dynamodb.us-west-2.amazonaws.com"
      });
      const docClient = new AWS.DynamoDB.DocumentClient();
      const table = api.config.aws.dynamoDBItemTableName;
      for (const urlIndex in urlToRemove) {
        const url = urlToRemove[urlIndex];
        const listOfURLletiations = getListOfletiationsofURLToSearchInDB(url);
        for (const urlletiationIndex in listOfURLletiations) {
          const urlletiation = listOfURLletiations[urlletiationIndex];
          const queryParams = {
            TableName: table,
            IndexName: "URL-index",
            KeyConditionExpression: "#URL = :url",
            ExpressionAttributeValues: {
              ":url": urlletiation
            },
            ExpressionAttributeNames: {
              "#URL": "URL"
            }
          };
          try {
            const data = await docClient.query(queryParams).promise();
            for (const item of data.Items) {
              console.log(item);
              const deleteParams = {
                TableName: table,
                Key: {
                  Device_Browser_Version: item.Device_Browser_Version,
                  URL: item.URL
                }
              };
              try {
                const data = await docClient.delete(deleteParams).promise();
                console.log(
                  "DeleteItem succeeded:",
                  JSON.stringify(data, null, 2)
                );
              } catch (err) {
                console.error(
                  "Unable to delete item. Error JSON:",
                  JSON.stringify(err, null, 2)
                );
              }
            }
          } catch (err) {
            console.error(
              "Unable to query. Error:",
              JSON.stringify(err, null, 2)
            );
          }
        }
      }
    }
    try {
      const params = {
        DistributionId: distribution.distributionID,
        InvalidationBatch: {
          CallerReference: `${Date.now()}`,
          Paths: {
            Quantity: owned_url.length,
            Items: owned_url
          }
        }
      };
      await this.cloudfront.createInvalidation(params).promise();
      return null;
    } catch (err) {
      console.log(err);
      const error = {
        code: 105,
        description: "Distribution not cleared",
        parameter: "Distribution"
      };
      return error;
    }
  }
  async updateCDN(
    userId,
    id,
    origin,
    website_id,
    defaultCacheTime,
    assetsEnabled,
    distributionObj
  ) {
    if (!origin.endsWith("/")) origin += "/";
    if (!distributionObj) {
      const error = {
        code: 105,
        description: "Cannot find distribution",
        parameter: "Distribution"
      };
      return error;
    }
    try {
      const distributionResponse = await this.cloudfront
        .getDistributionConfig({
          Id: distributionObj.distributionID
        })
        .promise();
      console.log(distributionResponse);
      distributionResponse.DistributionConfig.Comment = `created by api v7 from website for url ${origin}`;

      try {
        let params = {
          DistributionConfig: distributionResponse.DistributionConfig,
          Id: distributionObj.distributionID,
          IfMatch: distributionResponse.ETag
        };

        await this.cloudfront.updateDistribution(params).promise();

        try {
          await api.models.Distribution.update(
            {
              origin,
              websiteId: website_id,
              defaultCacheTime,
              jsEnabled: assetsEnabled.jsEnabled,
              cssEnabled: assetsEnabled.cssEnabled,
              imageEnabled: assetsEnabled.imageEnabled
            },
            {
              where: {
                id,
                userId,
                [Op.not]: {
                  [Op.or]: [
                    { status: "deleted" },
                    { status: "deletion in progress" }
                  ]
                }
              }
            }
          );
        } catch (_err) {
          console.log(_err);
          const error = {
            code: 108,
            description: "Distribution updation unsuccessful",
            parameter: "Distribution"
          };
          return error;
        }

        const dynamodb = new AWS.DynamoDB({
          region: api.config.aws.region
        });

        params = {
          TableName: api.config.aws.dynamoDBMasterTableName,
          Key: {
            host: {
              S: distributionObj.name
            }
          },
          UpdateExpression: `set origin = :origin, version = version + :one, defaultCacheTime  = :defaultCacheTime, jsEnabled = :jsEnabled, cssEnabled = :cssEnabled, imageEnabled = :imageEnabled`,
          ExpressionAttributeValues: {
            ":one": { N: "1" },
            ":origin": { S: origin },
            ":defaultCacheTime": { N: `${defaultCacheTime}` },
            ":jsEnabled": { BOOL: assetsEnabled.jsEnabled },
            ":cssEnabled": { BOOL: assetsEnabled.cssEnabled },
            ":imageEnabled": { BOOL: assetsEnabled.imageEnabled }
          }
        };
        try {
          const data = await dynamodb.updateItem(params).promise();
          console.log(
            `Successfully updated origin to ${origin} in table ${
              api.config.aws.dynamoDBMasterTableName
            } for host ${distributionObj.name}`,
            data
          );
        } catch (err) {
          console.error(
            `Error while updating origin to ${origin} in table ${
              api.config.aws.dynamoDBMasterTableName
            } for host ${distributionObj.name}:`,
            err
          );
          const error = {
            code: 111111,
            description: `Error while updating origin to ${origin} in table ${
              api.config.aws.dynamoDBMasterTableName
            } for host ${distributionObj.name}:`,
            parameter: "DynamoDB",
            error: err
          };
          return error;
        }
        return null;
      } catch (err) {
        console.log(err);
        const error = {
          code: 108,
          description: "Distribution updation unsuccessful",
          parameter: "Distribution"
        };
        return error;
      }
    } catch (err) {
      console.log(err);
      console.log(err, err.stack);
      const error = {
        code: 108,
        description: "Distribution updation unsuccessful",
        parameter: "Distribution"
      };
      return error;
    }
  }
  async deleteCDN(userId, id, distributionObj) {
    if (!distributionObj) {
      const error = {
        code: 102,
        description: "Distribution already deleted",
        parameter: "Distribution"
      };
      return error;
    }
    try {
      const distributionResponse = await this.cloudfront
        .getDistributionConfig({
          Id: distributionObj.distributionID
        })
        .promise();
      distributionResponse.DistributionConfig.Enabled = false;
      try {
        let params = {
          DistributionConfig: distributionResponse.DistributionConfig,
          Id: distributionObj.distributionID,
          IfMatch: distributionResponse.ETag
        };
        try {
          const updatedDistributionResponse = await this.cloudfront
            .updateDistribution(params)
            .promise();
          console.log("Task updation done");
          const deleteParams = {
            Id: distributionObj.distributionID,
            IfMatch: updatedDistributionResponse.ETag
          };
          console.log(deleteParams);
          let task_res;
          task_res = await api.tasks.enqueueIn(
            2700000,
            "deleteDistribution",
            deleteParams,
            "default"
          );
          if (!task_res) {
            await api.models.Distribution.update(
              {
                status: "deletion in progress"
              },
              {
                where: {
                  id,
                  userId,
                  [Op.not]: {
                    [Op.or]: [
                      { status: "deleted" },
                      { status: "deletion in progress" }
                    ]
                  }
                }
              }
            );
            console.log("Task queued");
          }
        } catch (err) {
          console.log(err);
          const error = {
            code: 108,
            description: "Distribution deletion unsuccessful",
            parameter: "Distribution"
          };
          return error;
        }

        const dynamodb = new AWS.DynamoDB({
          region: api.config.aws.region
        });
        params = {
          TableName: api.config.aws.dynamoDBMasterTableName,
          Key: {
            host: {
              S: distributionObj.name
            }
          }
        };
        try {
          const data = await dynamodb.deleteItem(params).promise();
          console.log(
            `Successfully deleted item with host ${
              distributionObj.name
            } in table ${api.config.aws.dynamoDBMasterTableName}`,
            data
          );
        } catch (err) {
          console.error(
            `Error while deleting item with host ${
              distributionObj.name
            } in table ${api.config.aws.dynamoDBMasterTableName}:`,
            err
          );
          const error = {
            code: 111111,
            description: `Error while deleting item with host ${
              distributionObj.name
            } in table ${api.config.aws.dynamoDBMasterTableName}`,
            parameter: "DynamoDB",
            error: err
          };
          return error;
        }
        return null;
      } catch (u_err) {
        return u_err;
      }
    } catch (config_err) {
      console.log(config_err);
      console.log(config_err, config_err.stack);
      const error = {
        code: 108,
        description: "Distribution disable unsuccessful",
        parameter: "Distribution"
      };
      return error;
    }
  }
};
