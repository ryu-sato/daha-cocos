import FormationBase from "./FormationBase";
import Enemy from "../Enemies/Enemy";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BurstBeamFormation extends FormationBase {

  /**
   * BurstBeamフォーメーションを組めるかどうか(override)
   */
  canBeInFormationWith(leader: Enemy) {
    return (leader !== null
      && this._board.existEnemyAt(leader.node.position.x - leader.node.width, leader.node.position.y + leader.node.height)
      && this._board.existEnemyAt(leader.node.position.x + leader.node.width, leader.node.position.y + leader.node.height));
  }

  /**
   * BurstBeamフォーメーションを組める相手を探して応答する(override)
   */
  findEnemiesWhichCanBeInFormationWith(leader: Enemy): Enemy[] {
    if (!this.canBeInFormationWith(leader)) {
      return [];
    }

    /* メンバーを配置された場所を元に探す */
    let members: Enemy[] = [];
    members.push(leader);
    let x: number = leader.node.position.x, y: number = leader.node.position.y;
    /* リーダーからプレイヤー側に向かって見て、右斜め後ろ方向の直線上にいるメンバーを参加させる */
    do {
      x -= leader.node.width;
      y += leader.node.height;
      const member = this._board.enemyAt(x, y);
      if (!member) {
        break;
      }
      members.push(member);
    } while(this._board.include(x, y));
    /* リーダーからプレイヤー側に向かって見て、左斜め後ろ方向の直線上にいるメンバーを参加させる */
    do {
      x += leader.node.width;
      y += leader.node.height;
      const member = this._board.enemyAt(x, y);
      if (!member) {
        break;
      }
      members.push(member);
    } while(this._board.include(x, y));
    return members;
  }
}
