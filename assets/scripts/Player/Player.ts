const { ccclass, property } = cc._decorator;

@ccclass
export default class Player extends cc.Component {

  @property(cc.Sprite)
  sprite_stop: cc.Sprite = null;

  @property(cc.Sprite)
  sprite_move_left: cc.Sprite = null;

  @property(cc.Sprite)
  sprite_move_right: cc.Sprite = null;

  @property(cc.Prefab)
  beam_prefab: cc.Prefab = null;  // ビーム

  // [TODO] Enum 型を使う
  state_live_list: string[] = ['ALIVE', 'EXPLODING', 'DEAD', 'REVIVING'];
  state_move_list: string[] = ['STOP', 'MOVE_LEFT', 'MOVE_RIGHT'];

  state_live: string = 'ALIVE';   // 生存ステータス
  state_move: string = 'STOP';    // 動作ステータス

  life: number = 1;               // 機体のライフ(デフォルト値は1だがフォーメーションを組むと増える)
  // fall_step_elapsed: number = 0;  // 落下アニメーションの経過ステップ数(MAXになったら0にリセットされる)

  move_dx: number = 20;           // 移動速度
  shooting_span: number = 0;      // 発射後の経過(intervalに達すると発射され、その後0にリセットされる))
  shooting_interval: number = 1;  // 発射間隔

  beams: cc.Node[] = [];

  /**
   * プレイヤーを移動させる
   * @param moveLeft 左への移動可否(否なら右へ移動))
   */
  movePlayer(moveLeft: boolean): void {
    this.state_move = moveLeft ? 'MOVE_LEFT' : 'MOVE_RIGHT';
    const half_width_of_parent = this.node.parent.width / 2;
    const half_width_myself = this.node.width / 2;
    const new_x = Math.max(-(half_width_of_parent) + half_width_myself, // 左端
                    Math.min(half_width_of_parent - half_width_myself,  // 右端
                      this.node.position.x - (moveLeft ? this.move_dx : -(this.move_dx))));  // 移動予定場所
    this.node.setPositionX(new_x);
  }

  /**
   * プレイヤーを停止させる
   */
  stopPlayer(): void {
    this.state_move = 'STOP';
  }

  /**
   * プレイヤーの画像をステータスに応じて再設定する
   */
  resetSpriteFrameByMoveState(): void {
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

  /**
   * ビームを発射する
   */
  shoot(): void {
    const beam = cc.instantiate(this.beam_prefab);

    beam.setPosition(this.node.position.x, this.node.position.y + this.node.height / 2);
    let dx: number = 0, dy: number = 10;
    switch (this.state_move) {
      case 'STOP':
        dx = 0;
        break;
      case 'MOVE_LEFT':
        dx = 2;
        break;
      case 'MOVE_RIGHT':
        dx = -2;
        break;
    }
    const direction = beam.getChildByName('direction');
    direction.width = dx;
    direction.height = dy;

    this.node.parent.addChild(beam);
    this.beams.push(beam);
    this.shooting_span = 0;
  }

  onEnable() {
    // 衝突判定を有効にする
    cc.director.getCollisionManager().enabled = true;
  }

  /**
   * ノード同士の処理処理
   * @param other 衝突相手
   * @param self 自分
   */
  onCollisionEnter(other, self) {
    if (other.tag === 3) {  // 敵機ビームとの衝突
      this.life--;
      if (this.life <= 0) {
        this.state_live = 'EXPLODING';
      }
    }
  }

  /* ===== LIFE-CYCLE CALLBACKS ===== */

  start() {
    // キーボード入力でプレイヤー移動とビーム発射を行う
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
        case cc.KEY.space:
          this.shooting_span++;
          if (this.shooting_span >= this.shooting_interval) {
            this.shoot();
          }
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
