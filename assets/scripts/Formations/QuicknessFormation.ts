import FormationBase from "./FormationBase";
import Enemy from "../Enemies/Enemy";
import PlayingCanvas from "../Playing/PlayingCanvas";

const {ccclass, property} = cc._decorator;

@ccclass
export default class QuicknessFormation extends FormationBase {

  // 付与する発射方向
  private burstDirections: cc.Size[] = [
    new cc.Size(0, -3),
  ];
  // 上昇させる発射速度
  protected quickness = 1;

  /**
   * フォーメーションを組めるかどうか(override)
   */
  canBeInFormationWith(leader: Enemy) {
    return (leader !== null
      && PlayingCanvas.instance.existEnemyAt(leader.x - leader.width, leader.y + leader.height)
      && PlayingCanvas.instance.existEnemyAt(leader.x + leader.width, leader.y + leader.height));
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
      PlayingCanvas.instance.enemyAt(leader.x - leader.width, leader.y + leader.height),
      PlayingCanvas.instance.enemyAt(leader.x + leader.width, leader.y + leader.height)];
  }

  /** 
   * メンバーを追加する(override)
   */
  protected joinEnemy(enemy: Enemy): boolean {
    const success = super.joinEnemy(enemy);
    if (!success) {
      return false;
    }
    if (enemy === this.leader) {
      this.burstDirections.forEach(d => enemy.addShootingDirection(d));
    }
    enemy.shootingInterval -= this.quickness;
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
    if (enemy === this.leader) {
      this.burstDirections.forEach(d => enemy.removeShootingDirection(d));
    }
    enemy.shootingInterval += this.quickness;
    return true;
  }
}
