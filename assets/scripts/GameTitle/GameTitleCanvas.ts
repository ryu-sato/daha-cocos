const { ccclass, property } = cc._decorator;

@ccclass
export default class GameTitleCanvas extends cc.Component {

  // オプション選択用カーソル
  @property(cc.Label)
  cursor: cc.Label = null;

  @property([cc.Label])
  menus: cc.Label[] = [];

  /* クラス変数(内部処理用) */
  selectedIndex: number = 0;
  cursorDy: number = 0;

  /**
   * カーソルを操作するキーボードイベントを処理する
   * @param e キーボードイベント
   */
  moveCursor(moveNext: boolean) {
    this.selectedIndex = (this.selectedIndex + (moveNext ? 1 : -1) + this.menus.length) % this.menus.length;
    this.cursor.node.setPositionY(this.menus[this.selectedIndex].node.position.y);
  }

  // LIFE-CYCLE CALLBACKS:
  start() {
    this.cursor.node.setPositionY(this.menus[0].node.position.y);
    this.cursorDy = this.menus[1].node.position.y - this.menus[0].node.position.y;

    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (e) => {
      switch(e.keyCode) {
        case cc.KEY.down:
          return this.moveCursor(true);
        case cc.KEY.up:
          return this.moveCursor(false);
      }

      /* スペースキーでシーンを遷移する */
      // [TODO] Exit メニューでアプリケーションを終了させる
      if (e.keyCode == cc.KEY.space) {
        const sceneNames: string[] = ['Playing', 'Option', 'Help', 'Exit'];
        cc.director.loadScene(sceneNames[this.selectedIndex]);
      }
    }, this);
  }
}
