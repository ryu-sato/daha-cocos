const { ccclass, property } = cc._decorator;

/**
 * ゲームオブジェクトの基底クラス
 */
@ccclass
export default class GameObjectBase extends cc.Component {

  // protected _xSquarePosition: number = 0;   // マス目盤上のx座標(画面左上が(0,0)、画面右下が(xMax,yMax))
  // protected _ySquarePosition: number = 0;   // マス目盤上のy座標(画面左上が(0,0)、画面右下が(xMax,yMax))

  // /* マス目盤上のy座標を取得する */
  // get ySquarePosition(): number {
  //   return this._ySquarePosition;
  // }

  // /* マス目盤上のy座標を設定する */
  // set ySquarePosition(value: number) {
  //   this._ySquarePosition = value;
  // }

  // /* マス目盤上のx座標を取得する */
  // get xSquarePosition(): number {
  //   return this._xSquarePosition;
  // }

  // /* マス目盤上のx座標を設定する */
  // set xSquarePosition(value: number) {
  //   this._xSquarePosition = value;
  // }
}
