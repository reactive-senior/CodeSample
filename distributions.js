const { Initializer, api } = require("actionhero");
const { Op } = require("sequelize");
const { CloudFrontCDN } = require("../lib/cloudfront");

module.exports = class Distributions extends Initializer {
  constructor() {
    super();
    this.name = "distributions";
    this.loadPriority = 1000;
    this.startPriority = 1000;
    this.stopPriority = 1000;
  }

  async initialize() {
    api.distributions = {
      getDistribution: async (userId, id) => {
        try {
          const distribution = await api.models.Distribution.find({
            attributes: [
              "id",
              "origin",
              "name",
              "type",
              "usage",
              "status",
              "savings",
              "defaultCacheTime",
              "jsEnabled",
              "cssEnabled",
              "imageEnabled"
            ],
            where: {
              id,
              userId,
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
          return { error: null, dataObj: distribution };
        } catch (err) {
          const error = {
            code: 100,
            description: err.message,
            parameter: ""
          };
          return { error, dataObj: null };
        }
      },

      getDistributions: async (userId, websiteId) => {
        const whereParams = {
          userId,
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
        };
        if (websiteId) {
          whereParams.websiteId = websiteId;
        }
        try {
          const distributions = await api.models.Distribution.findAll({
            attributes: [
              "id",
              "origin",
              "name",
              "type",
              "usage",
              "status",
              "websiteId",
              "defaultCacheTime",
              "jsEnabled",
              "cssEnabled",
              "imageEnabled"
            ],
            where: whereParams
          });
          return { error: null, dataObj: distributions };
        } catch (err) {
          console.log(err);
          const error = {
            code: 100,
            description: err.message,
            parameter: ""
          };
          return { error, dataObj: null };
        }
      },

      addDistribution: async (
        userObj,
        origin,
        websiteId,
        defaultCacheTime,
        assetsEnabled
      ) => {
        // type will be added, and if it is cloudfront then
        const CDN = new CloudFrontCDN();
        return await CDN.createCDN(
          userObj,
          origin,
          websiteId,
          defaultCacheTime,
          assetsEnabled
        );
      },

      clearDistribution: async (userId, id, url) => {
        let distribution;
        try {
          distribution = await api.models.Distribution.find({
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
          });
        } catch (err) {
          console.log(err);
          const error = {
            code: 100,
            description: err.message,
            parameter: ""
          };
          return error;
        }
        if (distribution && distribution.dataValues.type !== "CloudFront") {
          const error = {
            code: 102,
            description: "Only CloudFront is supported for now",
            parameter: "Distribution"
          };
          return error;
        }
        const CDN = new CloudFrontCDN();
        return await CDN.clearCDN(distribution, url);
      },

      updateDistribution: async (
        userId,
        id,
        origin,
        websiteID,
        defaultCacheTime,
        assetsEnabled
      ) => {
        const distributionObj = await api.models.Distribution.find({
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
        });
        if (distributionObj.dataValues.type !== "CloudFront") {
          const error = {
            code: 102,
            description: "Only CloudFront is supported for now",
            parameter: "Distribution"
          };
          return error;
        }
        const CDN = new CloudFrontCDN();
        return await CDN.updateCDN(
          userId,
          id,
          origin,
          websiteID,
          defaultCacheTime,
          assetsEnabled,
          distributionObj
        );
      },

      deleteDistribution: async (userId, id) => {
        const distributionObj = await api.models.Distribution.find({
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
        });
        if (distributionObj.dataValues.type !== "CloudFront") {
          const error = {
            code: 102,
            description: "Only CloudFront is supported for now",
            parameter: "Distribution"
          };
          return error;
        }
        const CDN = new CloudFrontCDN();
        return await CDN.deleteCDN(userId, id, distributionObj);
      }
    };
  }

  async start() {}

  async stop() {}
};