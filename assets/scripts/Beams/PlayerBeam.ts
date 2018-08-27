const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerBeam extends cc.Component {

  @property(cc.Node)
  direction: cc.Node = null; // 移動方向 [TODO]dx,dyをクラス変数で扱う

  lifeCount = 300;          // 寿命(凡そ画面外に抜けるだろう期間※画面との包含関係で確認したい)

  /* ===== LIFE-CYCLE CALLBACKS ===== */

  onEnable() {
    // 衝突判定を有効にする
    cc.director.getCollisionManager().enabled = true;
  }

  /**
   * ノード同士の処理処理
   * @param other 衝突相手
   * @param self 自分
   */
  onCollisionEnter(other, self) {
    if (other.tag === 1) {  // 敵機との衝突
      this.node.parent.removeChild(this.node);
    }
  }

  update (dt) {
    // 移動
    this.node.setPosition(
      this.node.position.x + this.direction.width,
      this.node.position.y + this.direction.height
    );

    // 画面外に出たら削除する
    // [NOTE] プレイヤー機からの相対値なので、ゲーム画面に座標は全て揃えたい
    if (this.lifeCount-- <= 0) {
      this.node.parent.removeChild(this.node);
    }
  }
}
