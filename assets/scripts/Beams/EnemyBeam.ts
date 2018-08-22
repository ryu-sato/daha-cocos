import PlayingCanvas from "../Playing/PlayingCanvas";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyBeam extends cc.Component {

  canvas: PlayingCanvas = null;

  @property(cc.Node)
  direction: cc.Node = null; // 移動方向 [TODO]dx,dyをクラス変数で扱う

  life_count = 300;          // 寿命(凡そ画面外に抜けるだろう期間※画面との包含関係で確認したい)

  /* ===== LIFE-CYCLE CALLBACKS ===== */

  update (dt) {
    // 移動
    this.node.setPosition(
      this.node.position.x + this.direction.width,
      this.node.position.y + this.direction.height
    );

    // 画面外に出たら削除する
    // [NOTE] プレイヤー機からの相対値なので、ゲーム画面に座標は全て揃えたい
    const parent_size = this.node.parent.getContentSize();
    if (this.life_count-- <= 0) {
      this.node.parent.removeChild(this.node);
    }
  }
}
