const { ccclass, property } = cc._decorator;

@ccclass
export default class GameTitleCanvas extends cc.Component {

  // オプション選択用カーソル
  @property(cc.Label)
  cursor: cc.Label = null;

  // メニュー項目表示用ラベル(シーンの名前とラベルのノードの名前を完全一致させること)
  @property([cc.Label])
  menus: cc.Label[] = [];

  /* クラス変数(内部処理用) */
  selectedIndex: number = 0;

  /**
   * カーソルを操作するキーボードイベントを処理する
   * @param e キーボードイベント
   */
  moveCursor(moveNext: boolean) {
    this.selectedIndex = (this.selectedIndex + (moveNext ? 1 : -1) + this.menus.length) % this.menus.length;
    this.cursor.node.setPositionY(this.menus[this.selectedIndex].node.position.y);
  }

  /* ===== LIFE-CYCLE CALLBACKS ===== */

  onLoad() {
    this.cursor.node.setPositionY(this.menus[0].node.position.y);

    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (e) => {
      switch(e.keyCode) {
        case cc.KEY.down:
          return this.moveCursor(true);
        case cc.KEY.up:
          return this.moveCursor(false);
      }

      /* スペースキーでシーンを遷移する */
      // [TODO] Exit メニューでアプリケーションを終了させる
      if (e.keyCode == cc.KEY.space || e.keyCode == cc.KEY.enter) {
        if (this.menus[this.selectedIndex].node.name === 'Exit') {
          cc.game.end();
        }
        cc.director.loadScene(this.menus[this.selectedIndex].node.name);
      }
    }, this);
  }
}
