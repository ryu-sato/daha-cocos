const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyBeam extends cc.Component {

  private _dx: number = 0;
  private _dy: number = 0;

  lifeCount = 300;          // 寿命(凡そ画面外に抜けるだろう期間※画面との包含関係で確認したい)

  get dx(): number {
    return this._dx;
  }

  set dx(value: number) {
    this._dx = value;
  }

  get dy(): number {
    return this._dy;
  }

  set dy(value: number) {
    this._dy = value;
  }

  /* ===== LIFE-CYCLE CALLBACKS ===== */

  update (dt) {
    // 移動
    this.node.setPosition(
      this.node.position.x + this._dx,
      this.node.position.y + this._dy
    );

    // 画面外に出たら削除する
    // [NOTE] プレイヤー機からの相対値なので、ゲーム画面に座標は全て揃えたい
    if (this.lifeCount-- <= 0) {
      this.node.parent.removeChild(this.node);
    }
  }
}
