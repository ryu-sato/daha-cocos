const { ccclass, property } = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

  // [TODO] Enum 型を使う
  state_live_list: string[] = ['ALIVE', 'EXPLODING', 'DEAD'];
  state_move_list: string[] = ['STOP', 'FALL'];

  state_live: string = 'ALIVE';   // 生存ステータス
  state_move: string = 'STOP';    // 動作ステータス

  life: number = 1;               // 機体のライフ(デフォルト値は1だがフォーメーションを組むと増える)
  // fall_step_elapsed: number = 0;  // 落下アニメーションの経過ステップ数(MAXになったら0にリセットされる)

  @property
  max_fall_step: number = 540;      // 落下アニメーションの最大ステップ数

  processExplode() {
    // [TODO] 爆発アニメーションを作成する
  }

  update (dt) {
    switch (this.state_live) {
      case 'ALIVE':
        this.node.setPositionY(this.node.position.y
          - (this.node.height / this.max_fall_step));
        return;
      case 'EXPLODING':
        this.processExplode();
        return;
    }
  }
}
