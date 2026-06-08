---
title: Angular
---

# Angular

<span class="dig-tag dig-tag--category">Web 与框架</span> <span class="dig-tag dig-tag--medium">⭐⭐ 中级</span> <span class="dig-tag dig-tag--medium">🔥 中频</span>

::: tip 💡 核心要点
Angular 是 Google 出品的全功能前端框架，内置模块化、依赖注入、路由、表单、HTTP 客户端等能力。与 React/Vue 不同，Angular 是一个"有主张"的框架，约定强、开箱即用。核心是理解 DI 系统、变更检测机制（Zone.js + OnPush）和 RxJS 响应式编程模型。
:::

---

## 版本演进时间线

Angular 的发展可分为**两段历史**：AngularJS（1.x）和 Angular（2+）。两者不是升级关系，而是完全不同的两个框架。Angular 2+ 之后每 6 个月发布一个大版本（5 月、11 月），节奏极其稳定。

### 第一段：AngularJS（2010 – 2021，已 EOL）

| 版本 | 时间 | 特征 |
|------|------|------|
| **AngularJS 1.0** | 2012.06 | 双向绑定（脏检查）、Controller + $scope、Directive、内置 DI | 
| **1.5** | 2016.02 | 引入 `.component()` API，为迁移到 Angular 2 铺路 |
| **1.8（最终版）** | 2020.07 | 最后一个 LTS 版本 |
| **EOL** | 2021.12.31 | **AngularJS 官方停止维护**，所有项目应迁移到 Angular 2+ 或其他框架 |

### 第二段：Angular（2016+，6 个月一个大版本）

| 版本 | 时间 | 关键变化 |
|------|------|---------|
| **2.0** | 2016.09 | **完全重写**，TypeScript 优先；组件化 + 模块化 + 单向数据流；引入 Zone.js 变更检测；与 1.x 不兼容 |
| **4** | 2017.03 | 跳过 3（Router 单独发布到 3.x 造成版本号冲突）；统一所有包到 4；体积优化 |
| **5** | 2017.11 | 引入 AOT 默认启用、HttpClient、新的 Build Optimizer |
| **6** | 2018.05 | **Angular CLI Workspace**（多项目）、`ng update` / `ng add`、Tree-Shakable Providers（`providedIn: 'root'`）、RxJS 6（`pipe()` 操作符） |
| **7** | 2018.10 | CDK 虚拟滚动、拖放；DoBootstrap 钩子 |
| **8** | 2019.05 | **Ivy 预览**、Differential Loading（ES5/ES2015 双包）、Web Workers 支持 |
| **9** | 2020.02 | **🔥 Ivy 编译器默认启用**：bundle 体积大幅缩小、增量编译、更好的调试体验 |
| **10** | 2020.06 | 升级 TypeScript 3.9；严格模式 `--strict` |
| **11** | 2020.11 | Webpack 5 实验性支持；Hot Module Replacement |
| **12** | 2021.05 | **View Engine 完全移除**，Ivy 成为唯一编译器；Webpack 5 默认 |
| **13** | 2021.11 | **彻底删除 View Engine**、Component API 升级、IE 不再支持 |
| **14** | 2022.06 | **🔥 Standalone Components 预览**（可不写 NgModule）、`inject()` 函数、Typed Forms、CLI 自动补全 |
| **15** | 2022.11 | **Standalone APIs 稳定**、Directive Composition、`NgOptimizedImage` |
| **16** | 2023.05 | **🔥 Signals 预览**（细粒度响应式，替代 Zone.js 检测）、`takeUntilDestroyed`、Required Inputs、SSR Hydration 非破坏性预览 |
| **17** | 2023.11 | **🔥 新控制流语法**（`@if` / `@for` / `@switch` 替代 `*ngIf` / `*ngFor`）、Deferrable Views（`@defer`）、SSR Hydration 稳定、**新文档站 angular.dev**、品牌焕新 |
| **18** | 2024.05 | **Signals 进入稳定**（input/output/model signals）、Material 3 GA、Zoneless 实验支持 |
| **19** | 2024.11 | **Standalone 成为默认**（脚手架默认不生成 NgModule）、`linkedSignal()`、`resource()` API、Hydration 增量预览 |
| **20** | 2025.05 | **Zoneless 稳定**（可彻底移除 Zone.js）、Signal Forms 实验、Reactive Resource、Server Routes 增强 |
| **21** | 2025.11 | Signal Forms 稳定预览；推进基于 Signal 的变更检测全面替代 Zone.js |
| **22** | 2026.05 | 持续巩固 Signal-based 响应式；Vite + esbuild 工具链进一步替代 Webpack |

::: warning ⚠️ 版本迁移高频面试题

1. **"AngularJS 和 Angular 是什么关系？"** → **不是升级关系**，是两个完全不同的框架。AngularJS 已 EOL（2021.12），不要在新项目使用。
2. **"为什么没有 Angular 3？"** → Router 子项目当时已经发布到 3.x，为了统一所有包版本号，主框架直接跳到 4。
3. **"Ivy 是什么？为什么重要？"** → Angular 9 默认启用的新编译器/运行时，相比 View Engine：**bundle 体积减小、增量编译更快、调试更友好、为 Standalone / Signals 等新特性铺路**。Angular 12 后 View Engine 完全移除。
4. **"Standalone Components 解决了什么问题？"** → 干掉 NgModule 的样板代码，组件可以独立声明依赖（直接在 `imports` 中写其他组件/指令/管道），**学习曲线接近 React/Vue**。
5. **"Signals 和 RxJS 是替代关系吗？"** → 不是。Signals 用于**组件内细粒度同步状态**，RxJS 用于**异步事件流**。两者共存：Signal 替代 `BehaviorSubject + async pipe` 的简单场景，复杂异步仍用 RxJS。
6. **"Zoneless 是什么？"** → Angular 18+ 实验、20 稳定的特性，**不再依赖 Zone.js 自动检测变更**，改由 Signals 驱动精确更新。优势：bundle 更小、性能更可预测；代价：需要全面采用 Signals。
:::

### 三大阶段心智模型

```
2010 ─────────── 2016 ─────────── 2022 ─────────── 2024+
"AngularJS 时代"  "Angular 2 时代"  "Standalone 时代"  "Signals/Zoneless 时代"
                  (NgModule + Zone) (干掉 NgModule)    (干掉 Zone.js)
   AngularJS      Angular 2-13      Angular 14-17      Angular 18+
   $scope 脏检查   TypeScript 强约定  样板代码大幅减少    Signal 响应式
   Controller     依赖注入 + RxJS    inject() 函数     精确细粒度更新
```

**面试黄金答法**：被问到"Angular 这些年发展"时按这四个阶段讲，并明确指出"AngularJS 已 EOL，现代 Angular 走向 Signal + Standalone + Zoneless 这一套'去样板化'路线"。

---

## 核心概念

### Angular 架构总览

Angular 应用由以下几个核心构件组成：

| 构件 | 装饰器 | 职责 |
|------|--------|------|
| 模块 | `@NgModule` | 组织代码的基本单元，声明组件、导入依赖、提供服务 |
| 组件 | `@Component` | UI 单元，由模板（HTML）+ 类（TypeScript）+ 样式组成 |
| 服务 | `@Injectable` | 封装业务逻辑，通过 DI 注入到组件或其他服务 |
| 指令 | `@Directive` | 自定义 DOM 行为，分为属性指令和结构指令 |
| 管道 | `@Pipe` | 数据转换，在模板中格式化显示内容 |

**Angular vs AngularJS（Angular 1.x）的区别：**

| 对比项 | AngularJS（1.x） | Angular（2+） |
|--------|-----------------|---------------|
| 语言 | JavaScript | TypeScript |
| 架构 | MVC | 组件化 |
| 变更检测 | 脏检查（$digest） | Zone.js + 单向数据流 |
| 性能 | 较差（脏检查循环） | 较好（可 OnPush 优化） |
| 移动端 | 不友好 | 支持 PWA、Angular Universal |
| 模块 | 自定义模块系统 | ES Modules + NgModule |

Angular 2+ 和 AngularJS 是两个完全不同的框架，不存在升级关系，面试中不要混用。

### 模块（NgModule）

```typescript
@NgModule({
  declarations: [AppComponent, UserListComponent, HighlightDirective], // 本模块的组件、指令、管道
  imports: [BrowserModule, HttpClientModule, RouterModule],             // 依赖的其他模块
  providers: [UserService],                                             // 本模块提供的服务（模块级）
  bootstrap: [AppComponent]                                            // 根模块才有，指定根组件
})
export class AppModule {}
```

**三个常见混淆项：**
- `declarations`：只能放本模块"拥有"的组件/指令/管道
- `imports`：引入其他模块（从而使用那个模块导出的内容）
- `providers`：注册服务到模块级注入器（通常用 `providedIn: 'root'` 代替）

### 组件（Component）

```typescript
@Component({
  selector: 'app-user-card',       // CSS 选择器，在模板中用 <app-user-card>
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // 可选，性能优化
})
export class UserCardComponent implements OnInit, OnDestroy {
  @Input() userId: string = '';          // 接收父组件传入的数据
  @Output() selected = new EventEmitter<string>(); // 向父组件发出事件
  
  user: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getUser(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 服务与依赖注入（DI）

Angular 的 DI 系统是其最重要的特性之一，与 Spring 的 IoC 容器思想类似。

**注册服务的三种方式：**

```typescript
// 方式一：providedIn: 'root'（推荐）— 注册到根注入器，全局单例，Tree-shaking 友好
@Injectable({
  providedIn: 'root'
})
export class AuthService {}

// 方式二：模块级 providers — 注册到模块注入器，该模块内单例
@NgModule({
  providers: [OrderService]
})
export class OrderModule {}

// 方式三：组件级 providers — 每个组件实例都有独立的服务实例
@Component({
  selector: 'app-form',
  providers: [FormStateService]  // 组件销毁时服务也销毁
})
export class FormComponent {}
```

**注入层级（从小到大）：**

```
元素注入器（组件/指令）
      ↓
模块注入器（NgModule）
      ↓
根注入器（providedIn: 'root'）
      ↓
平台注入器
```

查找服务时从当前层级向上查找，找到第一个匹配的注册就停止。

**在组件中注入服务：**

```typescript
@Component({ ... })
export class ProductListComponent {
  // 方式一：构造函数注入（传统方式）
  constructor(private productService: ProductService) {}
  
  // 方式二：inject() 函数（Angular 14+ 推荐，支持函数式组件）
  private router = inject(Router);
}
```

### 数据绑定

Angular 提供四种数据绑定方式：

```html
<!-- 1. 插值绑定：将组件属性渲染为文本 -->
<h1>{{ user.name }}</h1>
<p>{{ getGreeting() }}</p>

<!-- 2. 属性绑定：将表达式绑定到 DOM 属性（单向：组件 → 视图） -->
<img [src]="user.avatarUrl" [alt]="user.name">
<button [disabled]="isLoading">提交</button>
<app-card [title]="product.name"></app-card>

<!-- 3. 事件绑定：响应 DOM 事件（单向：视图 → 组件） -->
<button (click)="onSubmit()">提交</button>
<input (input)="onInput($event)" (keyup.enter)="onEnter()">

<!-- 4. 双向绑定：[(ngModel)] 是属性绑定 + 事件绑定的语法糖 -->
<input [(ngModel)]="searchText">
<!-- 等价于 -->
<input [ngModel]="searchText" (ngModelChange)="searchText = $event">
```

**内置指令：**

```html
<!-- 结构指令：改变 DOM 结构 -->
<div *ngIf="isLoggedIn; else loginTpl">欢迎, {{ user.name }}</div>
<ng-template #loginTpl><a>请登录</a></ng-template>

<ul>
  <li *ngFor="let item of items; trackBy: trackByItemId; let i = index">
    {{ i + 1 }}. {{ item.name }}
  </li>
</ul>

<div [ngSwitch]="status">
  <span *ngSwitchCase="'active'">活跃</span>
  <span *ngSwitchCase="'inactive'">停用</span>
  <span *ngSwitchDefault>未知</span>
</div>

<!-- 属性指令：改变元素外观或行为 -->
<div [ngClass]="{ 'active': isActive, 'error': hasError }">内容</div>
<p [ngStyle]="{ 'color': textColor, 'font-size': fontSize + 'px' }">文本</p>
```

### 变更检测（Change Detection）

Angular 不使用虚拟 DOM，而是直接追踪模板中的绑定表达式，通过 Zone.js 触发检测。

**默认策略（Default）：**

- Zone.js 通过猴子补丁（monkey-patch）拦截所有异步操作（setTimeout、Promise、XHR、事件监听等）
- 任意异步事件发生后，Angular 从根组件开始，自顶向下检查所有组件树
- 检查每个绑定表达式的值是否发生变化，有变化则更新 DOM

```typescript
// Zone.js 的工作原理（简化）
const originalSetTimeout = window.setTimeout;
window.setTimeout = function(fn, delay) {
  return originalSetTimeout(() => {
    fn();
    ngZone.run(() => { /* 触发变更检测 */ });
  }, delay);
};
```

**OnPush 策略：**

只在以下情况触发变更检测：
1. `@Input` 引用发生变化（注意是引用，不是值）
2. 组件或其子组件触发了事件
3. 手动调用 `ChangeDetectorRef.markForCheck()`
4. 使用 `async` 管道（内部自动调用 markForCheck）

```typescript
@Component({
  selector: 'app-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <li *ngFor="let item of items">{{ item.name }}</li>
    <!-- async 管道：自动订阅、取消订阅，并触发变更检测 -->
    <p>{{ currentTime$ | async | date }}</p>
  `
})
export class ListComponent {
  @Input() items: Item[] = [];
  currentTime$ = interval(1000);

  constructor(private cdr: ChangeDetectorRef) {}

  // 必要时手动触发
  loadMore(): void {
    this.items = [...this.items, ...newItems]; // 必须创建新数组，不能 push
    this.cdr.markForCheck();
  }
}
```

**与 React 的对比：**

| 对比项 | Angular（默认） | Angular（OnPush） | React |
|--------|----------------|-------------------|-------|
| 触发方式 | Zone.js 自动触发 | Input 变化/事件 | setState/useState |
| 虚拟 DOM | 无 | 无 | 有 |
| 检测范围 | 整棵组件树 | 标脏组件链 | 子树 |
| 不可变数据 | 不强制要求 | 强烈推荐 | 强烈推荐 |

### RxJS 与响应式编程

Angular 深度集成 RxJS，HttpClient、路由、表单等都返回 Observable。

**Observable 基础：**

```typescript
import { Observable, of, from, interval, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, switchMap, mergeMap, debounceTime, takeUntil, catchError } from 'rxjs/operators';

// 创建 Observable
const obs$ = new Observable<number>(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.complete();
});

// 订阅
const sub = obs$.subscribe({
  next: value => console.log(value),
  error: err => console.error(err),
  complete: () => console.log('完成')
});

// 取消订阅（避免内存泄漏）
sub.unsubscribe();
```

**常用操作符：**

```typescript
// switchMap：取消前一个，切换到新的（搜索框）
searchInput.valueChanges.pipe(
  debounceTime(300),        // 防抖：300ms 无输入再发请求
  distinctUntilChanged(),   // 值未变化不发请求
  switchMap(keyword =>      // 新关键词进来，取消上一个请求
    this.searchService.search(keyword).pipe(
      catchError(() => of([]))  // 错误时返回空数组
    )
  )
).subscribe(results => this.results = results);

// mergeMap：不取消，并发执行（上传多个文件）
fileList$.pipe(
  mergeMap(file => this.uploadService.upload(file))  // 并发上传
).subscribe(result => console.log('上传成功', result));

// map + filter：转换和过滤
this.http.get<User[]>('/api/users').pipe(
  map(users => users.filter(u => u.active)),  // 过滤活跃用户
  map(users => users.sort((a, b) => a.name.localeCompare(b.name)))
).subscribe(users => this.users = users);
```

**Subject 系列：**

```typescript
// Subject：多播，订阅后才能收到值
const subject = new Subject<string>();
subject.subscribe(v => console.log('A:', v));
subject.next('hello');  // A: hello
// 新订阅者收不到 'hello'

// BehaviorSubject：有初始值，新订阅者立即收到最新值（最常用）
const state$ = new BehaviorSubject<string>('初始值');
state$.subscribe(v => console.log('B:', v));  // 立即打印 '初始值'
state$.next('新值');  // 打印 '新值'
console.log(state$.getValue());  // 同步获取当前值

// ReplaySubject：缓存 N 个历史值，新订阅者收到缓存
const replay$ = new ReplaySubject<number>(3);  // 缓存最近 3 个
replay$.next(1); replay$.next(2); replay$.next(3); replay$.next(4);
replay$.subscribe(v => console.log(v));  // 打印 2, 3, 4
```

**Observable vs Promise 对比：**

| 对比项 | Promise | Observable |
|--------|---------|------------|
| 值数量 | 单个值 | 0 到多个值（流） |
| 执行时机 | 创建即执行（eager） | 订阅才执行（lazy） |
| 可取消 | 不可取消 | 可 unsubscribe |
| 操作符 | then/catch | 数十个操作符（map、filter、switchMap...） |
| 组合 | Promise.all | combineLatest、forkJoin、zip |

### 路由

```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'users/:id', component: UserDetailComponent },
  {
    path: 'admin',
    canActivate: [AuthGuard],       // 路由守卫
    loadChildren: () =>             // 懒加载模块
      import('./admin/admin.module').then(m => m.AdminModule)
  },
  { path: '**', component: NotFoundComponent }
];

// 读取路由参数
@Component({ ... })
export class UserDetailComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // 方式一：snapshot（只读取一次，适合不会变化的场景）
    const id = this.route.snapshot.paramMap.get('id');
    
    // 方式二：Observable（适合同一组件复用时参数变化的场景）
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.loadUser(id);
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }
}

// 路由守卫
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (this.auth.isLoggedIn()) {
      return true;
    }
    return this.router.createUrlTree(['/login']);
  }
}
```

### 表单

**模板驱动表单（Template-driven Forms）：**

```typescript
// 需要导入 FormsModule
@Component({
  template: `
    <form #loginForm="ngForm" (ngSubmit)="onSubmit(loginForm)">
      <input name="email" [(ngModel)]="email" required email #emailField="ngModel">
      <div *ngIf="emailField.invalid && emailField.touched">邮箱格式不正确</div>
      
      <input name="password" type="password" [(ngModel)]="password" required minlength="6">
      
      <button type="submit" [disabled]="loginForm.invalid">登录</button>
    </form>
  `
})
export class LoginComponent {
  email = '';
  password = '';

  onSubmit(form: NgForm): void {
    if (form.valid) {
      console.log(form.value);  // { email: '...', password: '...' }
    }
  }
}
```

**响应式表单（Reactive Forms）：**

```typescript
// 需要导入 ReactiveFormsModule
@Component({
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <input formControlName="email">
      <div *ngIf="email.hasError('email') && email.touched">邮箱格式不正确</div>
      
      <div formGroupName="passwords">
        <input formControlName="password" type="password">
        <input formControlName="confirm" type="password">
      </div>
      
      <button type="submit" [disabled]="loginForm.invalid">登录</button>
    </form>
  `
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    passwords: new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirm: new FormControl('')
    }, { validators: passwordMatchValidator })
  });

  get email() { return this.loginForm.get('email')!; }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log(this.loginForm.value);
    }
  }
}

// 自定义验证器
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password === confirm ? null : { mismatch: true };
}
```

**两种表单对比：**

| 对比项 | 模板驱动 | 响应式 |
|--------|---------|--------|
| 配置位置 | HTML 模板 | 组件类 |
| 数据流 | 双向绑定 | 响应式流（Observable） |
| 可测试性 | 较差（依赖 DOM） | 较好（纯 TS 测试） |
| 动态表单 | 困难 | 简单（FormArray） |
| 适用场景 | 简单表单 | 复杂表单、动态字段 |

### 性能优化

```typescript
// 1. OnPush 策略 + 不可变数据
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent {
  @Input() items: Item[] = [];

  addItem(newItem: Item): void {
    // 错误：直接 push 不会触发 OnPush 变更检测
    // this.items.push(newItem);
    
    // 正确：创建新数组
    this.items = [...this.items, newItem];
  }
}

// 2. trackBy 优化列表渲染
// 没有 trackBy：列表变化时 Angular 会销毁重建所有 DOM
// 有 trackBy：Angular 只更新变化的 DOM 节点
@Component({
  template: `
    <li *ngFor="let user of users; trackBy: trackByUserId">{{ user.name }}</li>
  `
})
export class UserListComponent {
  trackByUserId(index: number, user: User): string {
    return user.id;  // 返回唯一标识
  }
}

// 3. async 管道（自动管理订阅）
@Component({
  template: `
    <!-- 无需手动 subscribe/unsubscribe -->
    <div *ngFor="let item of items$ | async">{{ item.name }}</div>
    <p>{{ currentUser$ | async | json }}</p>
  `
})
export class DashboardComponent {
  items$ = this.itemService.getItems();
  currentUser$ = this.authService.currentUser$;
  
  constructor(
    private itemService: ItemService,
    private authService: AuthService
  ) {}
}

// 4. 懒加载（减少初始包体积）
const routes: Routes = [
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule)
  }
];
```

---

## 典型场景与最佳实践

### 防止内存泄漏

```typescript
// 方式一：takeUntil 模式（推荐，适合多个订阅）
@Component({ ... })
export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.userService.users$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(users => this.users = users);

    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => this.loadData(params['id']));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// 方式二：async 管道（最简洁，适合直接在模板中使用）
// 组件销毁时自动 unsubscribe，无需手动处理
```

### 状态管理

```typescript
// 使用 BehaviorSubject 实现简单的状态管理服务
@Injectable({ providedIn: 'root' })
export class CartService {
  private items$ = new BehaviorSubject<CartItem[]>([]);
  
  // 只暴露只读的 Observable
  readonly cartItems$ = this.items$.asObservable();
  readonly itemCount$ = this.items$.pipe(
    map(items => items.reduce((sum, item) => sum + item.quantity, 0))
  );

  addItem(item: CartItem): void {
    const current = this.items$.getValue();
    const existing = current.find(i => i.id === item.id);
    if (existing) {
      this.items$.next(current.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      this.items$.next([...current, item]);
    }
  }
}
```

#### NgRx vs Signals：Angular 2026 状态管理决策

::: tip 💡 一句话定位
**"Signals 吃掉了 80% 的 NgRx 应用场景"**——Angular 16+ 的 Signals 让"细粒度响应式状态"不再需要 Redux 风格样板代码。**NgRx 仍适合大型企业应用 + 严格的 Event Sourcing 模式**。
:::

```
┌────────────────────────────────────────────────┐
│ Q1: 服务端数据？                                │
│   是 → @ngrx/data / TanStack Query (Angular)   │
│   否 ↓                                         │
├────────────────────────────────────────────────┤
│ Q2: 只在一个组件内？                            │
│   是 → signal() / computed()                   │
│   否 ↓                                         │
├────────────────────────────────────────────────┤
│ Q3: 跨组件简单共享？                            │
│   是 → 共享 Service + signal（Boot 16+）       │
│   否 ↓                                         │
├────────────────────────────────────────────────┤
│ Q4: 大型应用、需要 Event Sourcing / DevTools？  │
│   是 → NgRx Store / NgRx Signals Store         │
│   否（中型）→ ComponentStore / Akita           │
└────────────────────────────────────────────────┘
```

| 方案 | 类别 | 2026 趋势 | 适合 |
|------|------|----------|------|
| **Signals**（核心 API） | 客户端状态 | 🔥🔥🔥 默认选择 | Angular 16+ 任何新项目 |
| **NgRx Signals Store** | 客户端状态 | 🔥🔥🔥 NgRx 18+ 新方向 | 中大型项目，受 Signal 加持 |
| **NgRx Store**（经典）| 客户端状态 | 🔥🔥 仍是企业级首选 | 大型项目、严格 Redux 模式 |
| **NgRx ComponentStore** | 局部状态 | 🔥 中等 | 复杂组件本地状态 |
| **Akita / Elf** | 客户端状态 | 🔥 | 偏 ORM 风格 |
| **RxJS BehaviorSubject** | 简单共享 | 🔥 仍可用 | 中小项目、迁移过渡 |

```typescript
// ✅ Signal 风格（Angular 16+）：极简
@Injectable({ providedIn: 'root' })
export class CartStore {
  // 状态
  private readonly _items = signal<CartItem[]>([]);

  // 公开只读
  readonly items = this._items.asReadonly();
  readonly itemCount = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );

  // 动作
  addItem(item: CartItem): void {
    this._items.update(curr => {
      const existing = curr.find(i => i.id === item.id);
      return existing
        ? curr.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...curr, item];
    });
  }
}

// 组件中使用 —— 模板自动追踪依赖
@Component({
  template: `<span>{{ cart.itemCount() }}</span>`
})
class CartIcon {
  cart = inject(CartStore);
}
```

#### Signal vs RxJS Observable：共存而非替代

| 维度 | **Signal** | **RxJS Observable** |
|------|-----------|---------------------|
| **本质** | 同步、可读值（getter） | 异步、值流 |
| **触发** | 同步读取最新值 | 订阅后异步推送 |
| **背压** | ❌ 不适用 | ✅ 操作符控制 |
| **典型场景** | UI 状态、表单值、计算属性 | HTTP 请求、WebSocket、用户事件流 |
| **互转** | `toSignal(obs$)` / `toObservable(sig)` | 同左 |
| **变更检测** | **细粒度**（只更新读取的组件） | 依赖 Zone.js / async pipe |

::: warning ⚠️ Zoneless（Angular 18+ 实验、20 稳定）
启用 Zoneless 后**必须用 Signal 驱动 UI**——RxJS Observable + async pipe 仍工作（async pipe 内部用 Signal 桥接），但**手动 ChangeDetectorRef.markForCheck() 完全失效**。这是迁移 Zoneless 的最大坑。
:::

---

## 面试常问 & 怎么答

### Q1: Angular 的变更检测机制是什么？

Angular 通过 Zone.js 实现自动变更检测。Zone.js 在应用启动时对浏览器的异步 API（setTimeout、Promise、事件监听等）做猴子补丁，任何异步操作完成后自动通知 Angular 运行变更检测。Angular 从根组件开始自顶向下遍历整棵组件树，检查每个绑定表达式的值是否变化，有变化则更新对应的 DOM 节点。

### Q2: OnPush 策略是什么？什么时候用？

OnPush 是一种性能优化策略，告诉 Angular 该组件只在以下情况才检查：Input 引用变化、组件内触发事件、或手动调用 `markForCheck()`。适用于展示型（"哑"）组件，即只接收 Input、不维护自身状态的组件。使用 OnPush 时必须遵守不可变数据原则，修改数组/对象时要创建新引用，不能直接 push/修改属性。

### Q3: Angular 的 DI 是怎么工作的？

Angular 维护一个层级注入器树，从组件级 → 模块级 → 根级。当组件声明构造函数参数时，Angular 按类型（Token）从当前层级向上查找注册的服务，找到就实例化并注入（已存在则复用）。推荐用 `providedIn: 'root'` 注册服务，既全局单例，又支持 Tree-shaking（未使用的服务不会打包进去）。

### Q4: RxJS 的 Observable 和 Promise 有什么区别？

三个核心区别：一是惰性（lazy），Promise 创建就执行，Observable 只有被 subscribe 才执行；二是多值，Promise 只能 resolve 一次，Observable 可以 emit 多个值（适合流数据）；三是可取消，Promise 无法取消，Observable 可以 unsubscribe。另外 Observable 有强大的操作符（map、filter、switchMap 等），便于处理复杂的异步逻辑。

### Q5: switchMap 和 mergeMap 的区别？

两者都把每个源值映射为新的 Observable，区别在于并发处理方式：switchMap 收到新值时会取消上一个未完成的 Observable，只保留最新的；mergeMap 则让所有 Observable 并发执行，结果以完成顺序输出。使用场景：switchMap 适合"以最新请求为准"的场景（搜索框输入、路由切换），mergeMap 适合需要并发且每个结果都要保留的场景（批量上传文件）。

### Q6: 模板驱动表单和响应式表单的区别？

模板驱动表单在 HTML 中用 `ngModel` 指令声明，逻辑在模板里，简单但难以测试和处理复杂动态场景。响应式表单在组件类中用 `FormGroup`/`FormControl` 显式构建表单模型，逻辑在 TypeScript 里，可测试性强，且表单状态是 Observable，适合复杂表单（动态添加字段、联动验证等）。大型项目推荐响应式表单。

### Q7: Angular 的模块系统（NgModule）有什么作用？

NgModule 提供三个功能：一是声明归属（declarations），明确组件/指令/管道属于哪个模块；二是依赖引入（imports），引入其他模块的功能；三是封装边界，模块内的内容默认不对外可见，需要通过 exports 显式导出。此外，懒加载路由以模块为单位，NgModule 是代码分割的边界。注意：Angular 14+ 引入了独立组件（Standalone Components），可以不依赖 NgModule。

### Q8: 如何做 Angular 应用的性能优化？

四个主要方向：一是**变更检测优化**，对展示型组件使用 OnPush 策略，减少不必要的检测次数；二是**列表渲染优化**，在 `*ngFor` 中使用 `trackBy` 函数，避免 DOM 节点被无谓重建；三是**代码分割**，通过懒加载路由（`loadChildren`）把非首屏模块拆出去，减小初始包体积；四是**AOT 编译**，生产环境用 AOT（Ahead-of-Time）而非 JIT，模板在构建时编译为原生 JS，运行时更快且包更小。

### Q9: 什么是 Zone.js？为什么 Angular 需要它？

Zone.js 是一个执行上下文追踪库，通过猴子补丁包装了浏览器几乎所有的异步 API（setTimeout、Promise、XHR、addEventListener 等）。Angular 需要它是因为 JavaScript 本身没有"数据变化"的通知机制，Zone.js 让 Angular 能在每次异步操作完成后自动执行变更检测，实现了"双向绑定自动更新"的效果，开发者不需要手动调用类似 `$scope.$apply()` 的方法。但 Zone.js 也是性能开销的来源之一，因此 Angular 团队在探索 Zoneless 方案（通过 Signals 代替 Zone.js）。

### Q10: Angular 的生命周期钩子有哪些？

按执行顺序：`ngOnChanges`（Input 变化时，在 ngOnInit 之前）→ `ngOnInit`（初始化，只执行一次）→ `ngDoCheck`（每次变更检测都执行）→ `ngAfterContentInit`（`<ng-content>` 投影内容初始化后）→ `ngAfterContentChecked` → `ngAfterViewInit`（组件视图及子视图初始化后，可安全操作 DOM）→ `ngAfterViewChecked` → `ngOnDestroy`（组件销毁前，清理订阅、计时器等）。最常用的是 `ngOnInit`、`ngOnDestroy`、`ngOnChanges`。

---

## 常见陷阱

| 陷阱 | 现象 | 解决方法 |
|------|------|---------|
| 忘记 unsubscribe | 组件销毁后订阅仍存活，回调持有组件引用，导致内存泄漏 | 使用 `takeUntil(destroy$)` 模式或 `async` 管道 |
| OnPush 组件中直接修改对象属性 | 修改了数据但视图没有更新 | 创建新对象/数组引用，或调用 `markForCheck()` |
| 循环依赖导致 DI 报错 | 启动时报 `Cannot instantiate cyclic dependency` | 重构服务，提取公共逻辑到第三个服务，打破循环 |
| NgModule 中 declarations/imports/providers 混淆 | 找不到组件、服务、指令等 | declarations 放本模块的组件/指令/管道；imports 放其他模块；providers 放服务（优先用 `providedIn`） |
| Zone.js 性能开销 | 频繁的异步操作（如 WebSocket）导致变更检测次数过多 | 用 `NgZone.runOutsideAngular()` 让某些操作跑在 Zone 外，需要更新 UI 时再调 `run()` |
| 在 ngAfterViewInit 之前访问 `@ViewChild` | `@ViewChild` 为 undefined，报错 | 必须在 `ngAfterViewInit` 及之后使用 `@ViewChild` 引用 |
| 异步管道（async pipe）使用不当 | 同一模板多次使用同一个 `obs$ \| async` 导致多次订阅 | 用 `*ngIf="obs$ \| async as data"` 订阅一次，通过 `data` 变量多次引用 |

---

## 看到什么就先想到这类

- 出现 `@NgModule`、`@Component`、`@Injectable`、`@Directive`、`@Pipe` — Angular 核心装饰器。
- 出现 `Zone.js`、变更检测、脏检查 — Angular 的自动更新机制。
- 出现 `OnPush`、`ChangeDetectionStrategy`、`markForCheck` — 变更检测优化。
- 出现 `Observable`、`Subject`、`BehaviorSubject`、`switchMap`、`mergeMap` — RxJS 响应式编程。
- 出现 `HttpClient`、`pipe`、操作符 — Angular HTTP 请求处理。
- 出现 `FormGroup`、`FormControl`、`FormBuilder`、`Validators` — 响应式表单。
- 出现 `CanActivate`、`Resolve`、`loadChildren` — 路由守卫和懒加载。
- 出现 `providedIn: 'root'`、注入层级、`inject()` — DI 系统。
- 出现内存泄漏、`takeUntil`、`unsubscribe` — Observable 订阅管理。
