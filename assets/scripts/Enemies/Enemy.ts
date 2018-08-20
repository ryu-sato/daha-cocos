const { ccclass, property } = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

  // [TODO] Enum 型を使う
  state_live_list: string[] = ['ALIVE', 'EXPLODING', 'DEAD'];
  state_move_list: string[] = ['STOP', 'FALL'];

  state_live: string = 'ALIVE';   // 生存ステータス
  state_move: string = 'FALL';    // 動作ステータス

  life: number = 1;               // 機体のライフ(デフォルト値は1だがフォーメーションを組むと増える)
  // fall_step_elapsed: number = 0;  // 落下アニメーションの経過ステップ数(MAXになったら0にリセットされる)

  @property(cc.Sprite)
  sprite_stop: cc.Sprite = null;    // 停止

  @property(cc.Sprite)
  sprite_explode: cc.Sprite = null; // 爆発アニメーション

  @property(cc.Sprite)
  sprite_fall: cc.Sprite = null;    // 落下アニメーション

  @property
  max_fall_step: number = 0;        // 落下アニメーションの最大ステップ数

  processAlive() {
    switch (this.state_move) {
      case 'FALL':
        const fall_anime_state = this.sprite_fall.getComponent(cc.Animation).getAnimationState("fall");
        if (!fall_anime_state.isPlaying || fall_anime_state.isPaused) {
          fall_anime_state.play();
        }
        this.node.setPositionY(this.node.position.y
          - (this.node.height / this.max_fall_step));
        return;
      case 'STOP':
        return;
    }
  }

  processExplode() {
    const explode_anime_state = this.sprite_explode.getComponent(cc.Animation).getAnimationState("explode");
    if (!explode_anime_state.isPlaying || explode_anime_state.isPaused) {
      explode_anime_state.play();
    } else if (explode_anime_state.time > 0.20) {
      this.state_live = 'DEAD';
    }
  }

  processDead() {
    this.node.parent.removeChild(this.node);
    // this.destroy();
  }

  /**
   * 敵機の画像をステータスに応じて再設定する
   */
  resetSpriteFrameByMoveState(): void {
    const sprite = this.node.getComponent(cc.Sprite);
    if (this.state_live === 'ALIVE') {
      switch(this.state_move) {
        case 'STOP':
          sprite.spriteFrame = this.sprite_stop.spriteFrame;
          return;
        case 'FALL':
          sprite.spriteFrame = this.sprite_fall.spriteFrame;
          return;
      }
    } else {
      switch(this.state_live) {
        case 'EXPLODING':
          sprite.spriteFrame = this.sprite_explode.spriteFrame;
          return;
        case 'DEAD':
          sprite.spriteFrame = this.sprite_explode.spriteFrame;
          return;
      }
    }
  }

  onEnable() {
    // 衝突判定を有効にする
    cc.director.getCollisionManager().enabled = true;
  }

  onCollisionEnter(other, self) {
    switch (other.tag) {
      case 2:  // プレイヤービーム
        this.state_live = 'EXPLODING';
        break;
    }
  }

  update(dt) {
    switch (this.state_live) {
      case 'ALIVE':
        this.processAlive();
        break;
      case 'EXPLODING':
        this.processExplode();
        break;
      case 'DEAD':
        this.processDead();
        break;
      default:
        console.log('invalid state: ' + this.state_live);
        break;
    }
    this.resetSpriteFrameByMoveState();
  }
}
