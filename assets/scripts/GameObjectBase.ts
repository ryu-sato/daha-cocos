import PlayingCanvas from "./Playing/PlayingCanvas";

const { ccclass, property } = cc._decorator;

/**
 * ゲームオブジェクトの基底クラス
 */
@ccclass
export default class GameObjectBase extends cc.Component {

  get x(): number {
    return this.node.position.x;
  }

  get xLeft(): number {
    return this.node.position.x - this.node.width / 2;
  }

  get xRight(): number {
    return this.node.position.x + this.node.width / 2;
  }

  get y(): number {
    return this.node.position.y;
  }

  get yTop(): number {
    return this.node.position.y + this.node.height / 2;
  }

  get yBottom(): number {
    return this.node.position.y - this.node.height / 2;
  }

  get width(): number {
    return this.node.width;
  }

  get height(): number {
    return this.node.height;
  }

  get xSquare(): number {
    return Math.floor(this.node.position.x / this.node.width);
  }

  get ySquare(): number {
    return Math.floor(this.node.position.y / this.node.height);
  }
}
