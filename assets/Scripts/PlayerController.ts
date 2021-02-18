
import { _decorator, Component, Vec3, systemEvent, SystemEvent, EventMouse, Animation, SkeletalAnimation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
  private _startJump: boolean = false;
  private _jumpStep: number = 0;
  public _curJumpTime: number = 0;
  private _jumpTime: number = 0.1;
  private _curJumpSpeed: number = 0;
  private _curPos: Vec3 = new Vec3();
  private _deltaPos: Vec3 = new Vec3(0, 0, 0);
  private _targetPos: Vec3 = new Vec3();
  private _isMoving = false;
  private stopTime: number = 0 // 跳跃停止时间
  private gameState: boolean = false // 游戏状态

  // 记录跳的步数
  private _curMoveIndex = 0;

  @property({ type: Animation })
  public BodyAnim: Animation = null;

  @property({type: SkeletalAnimation})
  public CocosAnim: SkeletalAnimation = null;

  start() {
    // Your initialization goes here.
    // systemEvent.on(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);
  }
  // 重新开始时，重置步数
  reset() {
    this._curMoveIndex = 0;
  }

  setInputActive(active: boolean) {
    if (active) {
      this.gameState = true
      systemEvent.on(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);
    } else {
      this.gameState = false
      systemEvent.off(SystemEvent.EventType.MOUSE_UP, this.onMouseUp, this);
    }
  }

  onMouseUp(event: EventMouse) {
    // 鼠标左键
    if (event.getButton() === 0) {
      this.jumpByStep(1);
    }
    else if (event.getButton() === 2) { // 鼠标右键
      this.jumpByStep(2);
    }

  }
                                                                                          
  jumpByStep(step: number) {
    if (this._isMoving) {
      return;
    }
    this._startJump = true;
    this._jumpStep = step;
    this._curJumpTime = 0;
    this._curJumpSpeed = this._jumpStep / this._jumpTime;
    this.node.getPosition(this._curPos);
    Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep, 0, 0));

    this._isMoving = true;

    this.CocosAnim.getState('cocos_anim_jump').speed = 3.5; // 跳跃动画时间比较长，这里加速播放
    this.CocosAnim.play('cocos_anim_jump'); // 播放跳跃动画

    this._curMoveIndex += step;

    if (step === 1) {
      this.BodyAnim.play('oneStep');
    }
    else if (step === 2) {
      this.BodyAnim.play('twoStep');
    }

  }

  onOnceJumpEnd() {
    this._isMoving = false;
    this.CocosAnim.play('cocos_anim_idle');
    this.node.emit('JumpEnd', this._curMoveIndex);
  }

  update(deltaTime: number) {
    if (this._startJump) {
      this.stopTime = 0
      this._curJumpTime += deltaTime;
      if (this._curJumpTime > this._jumpTime) {
        // 跳跃结束
        this.node.setPosition(this._targetPos);
        this._startJump = false;
        this.onOnceJumpEnd();
      } else {
        // 跳跃中
        this.node.getPosition(this._curPos);
        this._deltaPos.x = this._curJumpSpeed * deltaTime;
        Vec3.add(this._curPos, this._curPos, this._deltaPos);
        this.node.setPosition(this._curPos);
      }
    } else {
      if (this.gameState) {
        this.stopTime += deltaTime
        if (this.stopTime >= 5) {
          this.stopTime = 0
          this.node.emit('GameEnd');
        }
      }
    }
  }
}

