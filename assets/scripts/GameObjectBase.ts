import PlayingCanvas from "./Playing/PlayingCanvas";

const { ccclass, property } = cc._decorator;

/**
 * ゲームオブジェクトの基底クラス
 */
@ccclass
export default class GameObjectBase extends cc.Component {

  protected _board: PlayingCanvas = null;

  /**
   * ゲーム盤を設定する
   * @param board プレイ中のゲーム盤
   */
  setBoard(board: PlayingCanvas) {
    this._board = board;
  }
}
