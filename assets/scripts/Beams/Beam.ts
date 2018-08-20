const { ccclass, property } = cc._decorator;

@ccclass
export default class Beam extends cc.Component {

  @property
  dy: number = 10;

  @property
  dx: number = 0;

  life_count = 300;

  /*
   * ===== LIFE-CYCLE CALLBACKS =====
   */

  update (dt) {
    // 移動
    // [TODO] dx 方向へ移動する
    this.node.setPosition(
      this.node.position.x + this.dx,
      this.node.position.y + this.dy
    );

    // 画面外に出たら削除する
    // [NOTE] プレイヤー機からの相対値なので、ゲーム画面に座標は全て揃えたい
    const parent_size = this.node.parent.getContentSize();
    if (this.life_count-- <= 0) {
      this.node.parent.removeChild(this.node);
    }
  }
}
