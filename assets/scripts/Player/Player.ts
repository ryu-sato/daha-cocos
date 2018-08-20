const { ccclass, property } = cc._decorator;

@ccclass
export default class Player extends cc.Component {

  @property(cc.Sprite)
  sprite_stop: cc.Sprite = null;

  @property(cc.Sprite)
  sprite_move_left: cc.Sprite = null;

  @property(cc.Sprite)
  sprite_move_right: cc.Sprite = null;

  // [TODO] Enum 型を使う
  state_live_list: string[] = ['ALIVE', 'EXPLODING', 'DEAD', 'REVIVING'];
  state_move_list: string[] = ['STOP', 'MOVE_LEFT', 'MOVE_RIGHT'];

  state_live: string = 'ALIVE';   // 生存ステータス
  state_move: string = 'STOP';    // 動作ステータス

  life: number = 1;               // 機体のライフ(デフォルト値は1だがフォーメーションを組むと増える)
  // fall_step_elapsed: number = 0;  // 落下アニメーションの経過ステップ数(MAXになったら0にリセットされる)

  move_dx: number = 20;           // 移動速度

  /**
   * プレイヤーを移動させる
   * @param moveLeft 左への移動可否(否なら右へ移動))
   */
  movePlayer(moveLeft: boolean) {
    const half_width_of_parent = this.node.parent.width / 2;
    const half_width_myself = this.node.width / 2;
    const new_x = Math.max(-(half_width_of_parent) + half_width_myself, // 左端
                    Math.min(half_width_of_parent - half_width_myself,  // 右端
                      this.node.position.x - (moveLeft ? this.move_dx : -(this.move_dx))));  // 移動予定場所
    this.node.setPositionX(new_x);
  }

  /**
   * プレイヤーの画像をステータスに応じて再設定する
   */
  resetSpriteFrameByMoveState() {
    const sprite = this.node.getComponent(cc.Sprite);
    switch(this.state_move) {
      case 'STOP':
        sprite.spriteFrame = this.sprite_stop.spriteFrame;
        return;
      case 'MOVE_LEFT':
        sprite.spriteFrame = this.sprite_move_left.spriteFrame;
        return;
      case 'MOVE_RIGHT':
        sprite.spriteFrame = this.sprite_move_right.spriteFrame;
        return;
    }
  }

  processExplode() {
    // [TODO] 爆発アニメーションを作成する
  }

  processReviving() {
    // [TODO] 復活アニメーションを作成する
  }

  start() {
    // キーボード入力でプレイヤーを移動させる
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (e) => {
      switch (e.keyCode) {
        case cc.KEY.left:
          this.state_move = 'MOVE_LEFT';
          this.movePlayer(true);
          break;
        case cc.KEY.right:
          this.state_move = 'MOVE_RIGHT';
          this.movePlayer(false);
          break;
      }
      this.resetSpriteFrameByMoveState();
    }, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, (e) => {
      this.state_move = 'STOP';
      this.resetSpriteFrameByMoveState();
    }, this);
  }

  update(dt) {
    switch (this.state_live) {
      case 'ALIVE':
        return;
      case 'REVIVING':
        this.processReviving();
        return;
      case 'EXPLODING':
        this.processExplode();
        return;
    }
  }
}
