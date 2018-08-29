import GameObjectBase from "../GameObjectBase";
import PlayingCanvas from "../Playing/PlayingCanvas";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Beam extends GameObjectBase {

  private _dx: number = 0;
  private _dy: number = 0;

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
    if (PlayingCanvas.instance.exclude(this)) {
      this.node.parent.removeChild(this.node);
    }
  }
}
