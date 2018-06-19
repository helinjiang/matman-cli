import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Layout } from 'antd';

import { ajax } from '../../../../business/db';

import { loadMocker, loadMockerReadme, setMockerActiveModule, setMockerDisable } from '../../data/data-mocker';
import { loadMockerList } from '../../data/data-mocker-list';

import MockerBreadcrumb from './display-breadcrumb';
import MockerDetail from './display-detail';
import MockerShowResult from './display-show-result';
import MockerSwitcher from './display-action';
import MockModuleList from './display-mock-module-list';
import MockerReadme from './display-readme';
import MockerMenu from './display-menu';

import './index.less';

class Mocker extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      modalShowData: null
    };
  }

  componentDidMount() {
    console.log('Mocker componentDidMount', this.props);

    let { mockerName } = this.props.match.params;

    // 加载这个 mocker 的信息
    this.props.loadMocker(mockerName);
    this.props.loadMockerReadme(mockerName);

    // 加载所有的 mocker，主要是为了菜单展示
    this.props.loadMockerList();
  }

  handlePreviewResult = (query) => {
    const { mockerItem } = this.props;

    let actualURL = mockerItem.config.route;

    let host;

    if (process.env.NODE_ENV !== 'production') {
      host = 'localhost:9527';
    }

    // 如果有指定的host，则使用指定的host
    if (host && (actualURL.indexOf(host) < 0)) {
      actualURL = `http://${host}${actualURL}`;
    }

    ajax({
      method: mockerItem.config.method,
      url: actualURL,
      data: query
    })
      .then((data) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`url=${actualURL}`, query, data);
        }

        this.handleModalShow(data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  handleActive = (name) => {
    this.props.setMockerActiveModule(this.props.mockerItem.name, name);
  };

  handleModalShow = (data) => {
    this.setState({
      modalShowData: data
    });
  };

  handleModalHide = () => {
    this.setState({
      modalShowData: null
    });
  };

  handleDisable = () => {
    this.props.setMockerDisable(this.props.mockerItem.name, !this.props.mockerItem.config.disable);
  };

  render() {
    const { isLoaded, mockerItem, readme, match, mockerListInfo } = this.props;
    const { modalShowData } = this.state;

    return (
      <Layout className="mockers-mocker">
        <Layout.Sider className="mocker-sider">
          <MockerMenu mockerListInfo={mockerListInfo} match={match} />
        </Layout.Sider>

        <Layout className="mocker-content">
          <MockerBreadcrumb name={mockerItem.name} match={match} />

          {
            isLoaded ? (
              <div>
                <MockerSwitcher
                  isDisabled={mockerItem.config.disable}
                  activeModule={mockerItem.config.activeModule}
                  previewResult={this.handlePreviewResult.bind(this, null)}
                  updateDisable={this.handleDisable}
                />

                <MockerDetail
                  mockerItem={mockerItem}
                />

                <MockModuleList
                  isLoaded={isLoaded}
                  mockerItem={mockerItem}
                  previewResult={this.handlePreviewResult}
                  updateActive={this.handleActive}
                />

                <MockerShowResult
                  data={modalShowData}
                  onHide={this.handleModalHide}
                />

                <MockerReadme htmlContent={readme} />

              </div>
            ) : (
              <div>加载中...</div>
            )
          }
        </Layout>
      </Layout>
    );
  }
}

function mapStateToProps(state) {
  const { mockerInfo, mockerListInfo } = state;

  return {
    isLoaded: mockerInfo.isLoaded,
    mockerItem: mockerInfo.data,
    readme: mockerInfo.readme,
    mockerListInfo: mockerListInfo
  };
}

function mapDispatchToProps(dispatch) {
  return {
    loadMockerList() {
      return dispatch(loadMockerList());
    },

    loadMocker(mockerName) {
      return dispatch(loadMocker(mockerName));
    },

    loadMockerReadme(mockerName) {
      return dispatch(loadMockerReadme(mockerName));
    },

    setMockerActiveModule(mockerName, mockModuleName) {
      return dispatch(setMockerActiveModule(mockerName, mockModuleName));
    },

    setMockerDisable(mockerName, value) {
      return dispatch(setMockerDisable(mockerName, value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Mocker);


