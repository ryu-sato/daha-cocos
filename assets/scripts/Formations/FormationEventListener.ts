import FormationBase from "./FormationBase";

const {ccclass, property} = cc._decorator;

/**
 * フォーメーションイベントリスナー
 */
@ccclass
export default class FormationEventListener {
  /**
   * フォーメーションメンバーに参加する際に呼び出されるイベントを処理する
   */
  processJoinFormationMemberEvent(formation: FormationBase): void {
  }

  /**
   * フォーメーションメンバーから離脱する際に呼び出されるイベントを処理する
   */
  processLeaveFormationMemberEvent(formation: FormationBase): void {
  }
}
