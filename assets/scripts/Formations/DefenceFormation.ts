import FormationBase from "./FormationBase";
import Enemy from "../Enemies/Enemy";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DefenceFormation extends FormationBase {

  protected defencePower = 1;

  /**
   * フォーメーションを組めるかどうか(override)
   */
  canBeInFormationWith(leader: Enemy) {
    return (leader !== null
      && this._board.existEnemyAt(leader.node.position.x, leader.node.position.y + leader.node.height)
      && this._board.existEnemyAt(leader.node.position.x + leader.node.width, leader.node.position.y)
      && this._board.existEnemyAt(leader.node.position.x + leader.node.width, leader.node.position.y + leader.node.height));
  }

  /**
   * フォーメーションを組める相手を探して応答する(override)
   */
  protected findEnemiesWhichCanBeInFormationWith(leader: Enemy): Enemy[] {
    if (!this.canBeInFormationWith(leader)) {
      return [];
    }

    /* メンバーを配置された場所を元に探す */
    return [leader,
      this._board.enemyAt(leader.node.position.x, leader.node.position.y + leader.node.height),
      this._board.enemyAt(leader.node.position.x + leader.node.width, leader.node.position.y),
      this._board.enemyAt(leader.node.position.x + leader.node.width, leader.node.position.y + leader.node.height)];
  }

  /** 
   * メンバーを追加する(override)
   */
  protected joinEnemy(enemy: Enemy): boolean {
    const success = super.joinEnemy(enemy);
    if (!success) {
      return false;
    }
    enemy.strengthen(this.defencePower);
    return true;
  }

  /**
   * メンバーを離脱させる(override)
   */
  protected leaveEnemy(enemy: Enemy): boolean {
    const success = super.leaveEnemy(enemy);
    if (!success) {
      return false;
    }
    enemy.weaken(this.defencePower);
    return true;
  }
}
