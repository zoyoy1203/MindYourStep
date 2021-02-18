import { _decorator, Component, Prefab, instantiate, Node, CCInteger, Label, Vec3 } from "cc";
import { PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

enum BlockType {
  BT_NONE,   // 无地面
  BT_STONE,  // 有地面
};

enum GameState {
  GS_INIT,
  GS_PLAYING,
  GS_END,
};

@ccclass("GameManager")
export class GameManager extends Component {


  @property({ type: Prefab })
  public cubePrfb: Prefab = null;
  @property({ type: CCInteger })
  public roadLength: Number = 50;
  @property({ type: PlayerController })
  public playerCtrl: PlayerController = null;
  @property({ type: Node })
  public startMenu: Node = null;
  @property({ type: Node })
  public endMenu: Node = null;
  @property({type: Label})
  public stepsLabel: Label = null;
  @property({type: Label})
  public score: Label = null;
  @property({type: Label})
  public time: Label = null;
  private _road: number[] = [];
  private gameTime: number = 0;

  private _curState: GameState = GameState.GS_INIT;


  start() {
    // this.generateRoad();
    this.curState = GameState.GS_INIT;
    // 监听角色跳跃消息，并调用判断函数
    this.playerCtrl.node.on('JumpEnd', this.onPlayerJumpEnd, this);
    // 跳跃停止时间超时，游戏结束
    this.playerCtrl.node.on('GameEnd', this.gameEnd, this);
  }
  init() {
    this.playerCtrl.reset();
    this.endMenu.active = false;
    this.startMenu.active = true;
    this.generateRoad();
    this.playerCtrl.setInputActive(false);
    this.playerCtrl.node.setPosition(Vec3.ZERO);
  }

  onPlayerJumpEnd(moveIndex: number) {
    this.stepsLabel.string = '' + moveIndex;
    this.score.string = '' + moveIndex
    this.checkResult(moveIndex);
  }

  gameEnd () {
    this.curState = GameState.GS_END;
  }

  set curState(value: GameState) {
    switch (value) {
      case GameState.GS_INIT:
        this.init();
        break;
      case GameState.GS_PLAYING:
        this.startMenu.active = false;
        this.stepsLabel.string = '0';   // 将步数重置为 0
        setTimeout(() => {      // 直接设置 active 会直接开始监听鼠标事件，这里做了延迟处理
          this.playerCtrl.setInputActive(true);
        }, 0.1);
        break;
      case GameState.GS_END:
        this.endMenu.active = true
        this.playerCtrl.setInputActive(false);
        break;
    }
    this._curState = value;
  }

  // 动态生成跑道
  generateRoad() {
    this.node.removeAllChildren();
    this._road = [];
    // startPos
    this._road.push(BlockType.BT_STONE);

    for (let i = 1; i < this.roadLength; i++) {
      if (this._road[i - 1] === BlockType.BT_NONE) {
        this._road.push(BlockType.BT_STONE);
      } else {
        this._road.push(Math.floor(Math.random() * 2));
      }
    }
    for (let j = 0; j < this._road.length; j++) {
      let block: Node = this.spawnBlockByType(this._road[j]);
      if (block) {
        this.node.addChild(block);
        block.setPosition(j, -1.5, 0);
      }
    }
  }

  spawnBlockByType(type: BlockType) {
    let block = null;
    switch (type) {
      case BlockType.BT_STONE:
        block = instantiate(this.cubePrfb);
        break;
    }

    return block;
  }

  // 点击菜单paly按钮
  onStartButtonClicked() {
    this.curState = GameState.GS_PLAYING;
  }

  // 点击菜单结束按钮
  onEndButtonClicked() {
    this.curState = GameState.GS_INIT;
  }

  // 根据规则判断输赢，增加失败和结束判断，如果跳到空方块或是超过了最大长度值都结束：
  checkResult(moveIndex: number) {
    if (moveIndex <= this.roadLength) {
      if (this._road[moveIndex] == BlockType.BT_NONE) {   // 跳到了空方块上
        this.curState = GameState.GS_END;
      }
    } else {    // 跳过了最大长度
      this.curState = GameState.GS_END;
    }
  }


  update (deltaTime: number) {
    if (this._curState === GameState.GS_INIT) {
      this.gameTime = 0
    } else if (this._curState === GameState.GS_PLAYING) {
      this.gameTime += deltaTime
    }
    this.time.string = '' + this.gameTime.toFixed(2)  // 挑战时间
   
  }
}