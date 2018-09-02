import Enemy from "../Enemies/Enemy";
import GameObjectBase from "../GameObjectBase";
import PlayingCanvas from "../Playing/PlayingCanvas";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FormationBase extends GameObjectBase {

  protected _leader: Enemy = null;
  protected _members: Enemy[] = [];

  /**
   * リーダーを取得する
   */
  get leader(): Enemy {
    return this._leader;
  }

  /**
   * フォーメーションを組めるかどうか
   */
  canBeInFormationWith(leader: Enemy): boolean {
    return false;
  }

  /**
   * フォーメーションを組む
   * @param leader リーダー
   */
  constructFormation(leader: Enemy): boolean {
    if (!this.canBeInFormationWith(leader)) {
      return false;
    }
    const members = this.findEnemiesWhichCanBeInFormationWith(leader);
    if (members === null || members === []) {
      return false;
    }
    this._leader = leader;
    members.forEach(m => this.joinEnemy(m));
    this._members = members;
  }

  /**
   * フォーメーションを崩す
   */
  deconstructFormation(): void {
    this._members.forEach(m => this.leaveEnemy(m));
    this._members = [];
    this._leader = null;
    PlayingCanvas.instance.destroyFormation(this);
  }

  /**
   * フォーメーションを組める相手を探して応答する
   */
  protected findEnemiesWhichCanBeInFormationWith(leader: Enemy): Enemy[] {
    return [];
  }

  /** 
   * メンバーを追加する
   */
  protected joinEnemy(enemy: Enemy): boolean {
    if (this._members.indexOf(enemy) != -1) {
      console.log('Enemy already exist: ' + enemy.name);
      return false;
    }
    enemy.processJoinFormationMemberEvent(this);
    return true;
  }

  /**
   * メンバーを離脱させる
   */
  protected leaveEnemy(enemy: Enemy): boolean {
    const index = this._members.indexOf(enemy);
    if (index === -1) {
      console.log('Enemy not exist: ' + enemy.name);
      return false;
    }
    enemy.processLeaveFormationMemberEvent(this);
    return true;
  }
}
