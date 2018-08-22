import PlayingCanvas from "../Playing/PlayingCanvas";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

  canvas: PlayingCanvas = null;

  // [TODO] Enum 型を使う
  state_live_list: string[] = ['ALIVE', 'EXPLODING', 'DEAD'];
  state_move_list: string[] = ['STOP', 'FALL'];

  state_live: string = 'ALIVE';     // 生存ステータス
  state_move: string = 'STOP';      // 動作ステータス

  life: number = 1;                 // 機体のライフ(デフォルト値は1だがフォーメーションを組むと増える)

  @property(cc.Sprite)
  sprite_stop: cc.Sprite = null;    // 停止

  @property(cc.Sprite)
  sprite_explode: cc.Sprite = null; // 爆発アニメーション

  @property(cc.Sprite)
  sprite_fall: cc.Sprite = null;    // 落下アニメーション

  @property
  max_fall_step: number = 0;        // 落下アニメーションの最大ステップ数

  @property(cc.Prefab)
  beam_prefab: cc.Prefab = null;    // ビーム

  shooting_span: number = 0;        // 発射後の経過(intervalに達すると発射され、その後0にリセットされる))
  shooting_interval: number = 60;   // 発射間隔

  beams: cc.Node[] = [];

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
        this.shooting_span++;
        if (this.shooting_span >= this.shooting_interval) {
          this.shoot();
        }
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

  shoot(): void {
    const beam = cc.instantiate(this.beam_prefab);

    beam.setPosition(this.node.position.x, this.node.position.y - this.node.height / 2);
    let dx: number = 0, dy: number = -3;
    // [TODO] フォーメーションに応じて攻撃方法を変える
    const direction = beam.getChildByName('direction');
    direction.width = dx;
    direction.height = dy;

    this.node.parent.addChild(beam);
    this.beams.push(beam);
    this.shooting_span = 0;
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
          return;
      }
    }
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
    if (other.tag === 2) {  // プレイヤービームとの衝突
      this.life--;
      if (this.life <= 0) {
        this.state_live = 'EXPLODING';
      }
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
