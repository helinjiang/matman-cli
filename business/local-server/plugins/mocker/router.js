const _ = require('lodash');
const baseRouter = require('../../server/router/base-router');
const matman = require('../../../../business/matman');

const MockerParser = matman.MockerParser;
const QUERY_KEY = matman.QUERY_KEY;
const mockerUtil = matman.mockerUtil;

const PLUGIN_NAME = 'mocker';
const HANDLER_NAME_FIELD = 'mockerName';

module.exports = (router, entry) => {
  const mockerParser = new MockerParser({
    basePath: entry.mockServerPath,
    dataPath: entry.dataPath
  });

  let mockerList = mockerParser.getAllMocker();

  // GET /matman-cgi/mocker 所有的 mocker 列表信息
  baseRouter.initGetList(router, PLUGIN_NAME, (req, res) => {
    let mockerList = mockerParser.getAllMocker();

    res.jsonp(mockerList);
  });

  // GET /matman-cgi/mocker/:mockerName 获得这个 mocker 的信息
  baseRouter.initGetOne(router, PLUGIN_NAME, HANDLER_NAME_FIELD, (req, res) => {
    let result = mockerParser.getMockerByName(req.params[HANDLER_NAME_FIELD]);

    res.jsonp(result);
  });

  // POST /matman-cgi/mocker/:mockerName 设置这个 mocker 的信息
  baseRouter.initPostOne(router, PLUGIN_NAME, HANDLER_NAME_FIELD, (req, res) => {
    let result = mockerParser.updateMocker(req.params[HANDLER_NAME_FIELD], req.body);

    res.jsonp(result);
  });

  // GET /matman-cgi/mocker/:mockerName/readme 获得这个 mocker 的 readme 信息
  baseRouter.initGetOneReadMe(router, PLUGIN_NAME, HANDLER_NAME_FIELD, (req, res) => {
    res.jsonp({
      html: mockerParser.getReadMeContent(req.params[HANDLER_NAME_FIELD])
    });
  });

  // 根据用户配置的路由关系，进行解析
  // console.log('mockerList', mockerList);
  mockerList.forEach((mockerItem) => {
    // console.log(mockerData);

    // mocker 的配置项在其 config 字段中
    const mockerConfig = mockerItem.config;

    // 判断是否存在 route 字段，如果没有，则不再处理
    const ROUTE_PATH = mockerConfig.route;
    if (!ROUTE_PATH) {
      // TODO 返回
    }

    // 默认是 get 请求，除非定义 method 字段
    const METHOD = (mockerConfig.method || 'get').toLowerCase();

    // http://expressjs.com/en/4x/api.html#router.METHOD
    router[METHOD](ROUTE_PATH, function (req, res, next) {
      // Express的req对象，详见 http://expressjs.com/en/4x/api.html#req

      // post 请求
      // handlerData.route="/cgi-bin/a/b/post_cgi"
      // post http://localhost:9527/cgi-bin/a/b/post_cgi data={activeModule:"error_not_login"}
      // req.baseUrl=""
      // req.originalUrl="/cgi-bin/a/b/post_cgi"
      // req.url="/cgi-bin/a/b/post_cgi"
      // req.method="POST"
      // req.OriginalMethod="POST"
      // req.body.activeModule = "error_not_login"
      // req.body = data

      // get 请求
      // handlerData.route="/cgi-bin/a/b/simple_cgi"
      // get http://localhost:9527/cgi-bin/a/b/simple_cgi?activeModule=error_not_login
      // req.baseUrl=""
      // req.originalUrl="/cgi-bin/a/b/simple_cgi?activeModule=error_not_login"
      // req.url="/cgi-bin/a/b/simple_cgi?activeModule=error_not_login"
      // req.method="GET"
      // req.OriginalMethod="GET"
      // req.query.activeModule = "error_not_login"

      // get 请求且route为匹配类型
      // handlerData.route="/cgi-bin/a/b/id/:id"
      // get http://localhost:9527/cgi-bin/a/b/id/1?activeModule=error_not_login
      // req.baseUrl=""
      // req.originalUrl="/cgi-bin/a/b/id/1?activeModule=error_not_login"
      // req.url="/cgi-bin/a/b/id/1?activeModule=error_not_login"
      // req.method="GET"
      // req.OriginalMethod="GET"
      // req.query.activeModule = "error_not_login"
      // req.params.id = "1"

      // console.log(req.headers.referer)
      res.header('Access-Control-Allow-Origin', '*');

      let isDisabled;

      // 判断该路由的名字是否在referer中
      let matmanQueryItem = mockerUtil.getMatmanQueryItem(req.headers.referer, mockerItem.name);

      if (matmanQueryItem) {
        // referer 里面的请求参数拥有最高优先级，因为这种场景比较特殊，主要用于自动化测试之用
        isDisabled = matmanQueryItem.isDisabled();
      } else {
        // 从请求 req 或者 config.json 文件中检查当前请求是否需要禁用 mock 服务
        isDisabled = req.query[QUERY_KEY] || req.body[QUERY_KEY];
        if (!isDisabled) {
          // 此处要重新获取新的数据，以便取到缓存的。
          // TODO 此处还可以优化，比如及时更新缓存中的数据，而不需要每次都去获取
          let curMockerItem = mockerParser.getMockerByName(mockerItem.name, true);
          isDisabled = curMockerItem.config.disable;
        }
      }

      if (isDisabled) {
        // 如果当前禁用了 handle 服务，则不处理
        res.locals.isDisabled = true;
        res.locals.mockerName = mockerItem.name;
        next();
      } else {
        let url = ROUTE_PATH;
        let params = (METHOD === 'post') ? req.body : req.query;

        // 还要合并一下来自 url path 中的参数值
        // referer 里面的请求参数拥有最高优先级，因为这种场景比较特殊，主要用于自动化测试之用
        params = _.merge({}, params, req.params, matmanQueryItem);

        const resInfo = mockerParser.getResInfoByRoute(url, params);

        if (!resInfo) {
          let errMsg = 'Could not get reqInfo by route=' + url + ' and params=' + JSON.stringify(params);
          console.error(errMsg);
          res.status(500).send(errMsg);
          return;
        }

        resInfo.mockModuleItem.getResult(params, req)
          .then((result) => {
            // 增加特定标记，以便抓包时能够识别是否为打桩数据
            res.append('x-matman-mocker', resInfo.mockerItem.name);
            res.append('x-matman-mock-module', resInfo.mockModuleItem.name);

            // 延时返回
            let delay = resInfo.mockModuleItem.config.delay || 0;
            res.append('x-matman-delay', delay + '');

            if (delay) {
              setTimeout(() => {
                res.jsonp(result);
              }, delay);
            } else {
              res.jsonp(result);
            }
          })
          .catch((err) => {
            // 注意 err 有可能是 Error 对象，也可能是普通的字符串或对象
            let errMsg = err && err.stack || err;

            console.error(errMsg);

            res.status(500).send(errMsg);
          });
      }

    });
  });

  // 携带变量出去
  router._mockerParser = mockerParser;
};
