const { ccclass, property } = cc._decorator;

@ccclass
export default class Help extends cc.Component {

  /* ===== LIFE-CYCLE CALLBACKS ===== */

  onLoad() {
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (e) => {
      const pageView = this.node.getChildByName('pageview').getComponent(cc.PageView);
      const pageIndex = pageView.getCurrentPageIndex();
      switch (e.keyCode) {
        case cc.KEY.left:
          pageView.setCurrentPageIndex(pageIndex - 1);
          break;
        case cc.KEY.right:
          pageView.setCurrentPageIndex(pageIndex + 1);
          break;
        case cc.KEY.escape:
          cc.director.loadScene('GameTitle');
        break;
      }
    }, this);
  }
}
