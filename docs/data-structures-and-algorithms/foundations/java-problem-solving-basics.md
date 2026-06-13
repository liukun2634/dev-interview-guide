---
title: Java 环境配置
---

# Java 环境配置（输入输出 / 容器 / 字符串 / 位运算 速查）

<span class="dig-tag dig-tag--category">基础知识</span> <span class="dig-tag dig-tag--easy">⭐ 入门</span> <span class="dig-tag dig-tag--hot">🔥🔥🔥 高频</span>

::: tip 💡 章节范围
本页是 **Java 刷题的 API 速查手册**——把面试/笔试常用 Java API（数组、字符串、List、Map、Set、TreeMap、Deque、PriorityQueue、位运算、Math、Comparator）按场景整理，每行代码都带行内注释和必踩坑。算法思路与套路见 [基础算法模板](./basic-templates) 和 [高阶算法模板](./advanced-templates)；Java 语言本身的语法、JVM、并发原理见 [Java 体系](../../programming-languages/java-fundamentals)。
:::

## 这页解决什么问题

- **没坑也能写错 API**：Java 集合命名长、重载多（`remove(int)` vs `remove(Integer)`、`Arrays.asList(int[])` 陷阱），不查就翻车。
- **写代码 = 查 API**：刷题白板上没有 IDE 提示，模板必须烂熟于心。
- **看到题秒选容器**：哪些用 `HashMap`、哪些用 `TreeMap`、哪些用 `Deque`、哪些用 `PriorityQueue`，一图速查表里直接对应。
- **大数据知道换 IO**：默认 `Scanner` 就够；数据 ≥ 10⁵ 立刻换 `BufferedReader`，不要等 TLE 才反应。

## 怎么使用本页

1. **新手起步**：先抄一份 `Scanner` 模板 + `Arrays / String / HashMap / Deque / PriorityQueue` 的常用 5-10 个方法，能跑通 LeetCode 前 100 题。
2. **打 ACM / 牛客 / Codeforces**：直接用 `BufferedReader + PrintWriter` 快读快写模板，输出大量数据时记得 `flush()`。
3. **遇到不会的 API**：用 `Ctrl+F` 搜本页关键词（如 `floorKey` / `computeIfAbsent` / `bitCount`），右边都有行内注释和必踩坑说明。
4. **复盘归档**：每做完一题，把这题用到的 API 加进自己的私人 cheatsheet；本页是底线，不是天花板。

## 容器选型一图速查

| 场景 | 首选容器 | 关键 API |
|------|---------|---------|
| **频次统计 / 键值映射** | `HashMap<K, V>` | `getOrDefault` / `merge` / `computeIfAbsent` |
| **按插入序遍历 / LRU** | `LinkedHashMap` | + `removeEldestEntry` 重写 |
| **范围查询 / 找上下界** | `TreeMap` / `TreeSet` | `floorKey` / `ceilingKey` / `subMap` |
| **去重 / 是否存在 O(1)** | `HashSet` | `add` / `contains` |
| **动态数组** | `ArrayList` | `add` / `get` / `set` |
| **栈** | `ArrayDeque`（**不用 `Stack`**）| `push` / `pop` / `peek` |
| **队列 / BFS** | `ArrayDeque`（**不用 `LinkedList`**）| `offer` / `poll` / `peek` |
| **单调队列 / 双端** | `ArrayDeque` | `offerFirst` / `pollLast` / `peekLast` |
| **Top K / 堆排序** | `PriorityQueue` | `offer` / `poll`，大顶堆用 `Comparator.reverseOrder()` |
| **静态常量集合** | `List.of` / `Map.of`（JDK 9+） | 不可变，写起来短 |

## 高频命令

### 简单输入模板（Scanner，学习/小数据用）

**Scanner** 是 JDK 自带的最易用输入工具，**学习算法、刷小数据题、面试白板**首选。语法直白、几乎不会写错；**唯一缺点是慢**（内部基于正则切分），数据量 ≥ 10⁵ 时才需要换 BufferedReader。

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // 1. 读单个值
        int n = sc.nextInt();                 // 读一个 int
        long x = sc.nextLong();               // 读一个 long
        double d = sc.nextDouble();           // 读一个 double
        String word = sc.next();              // 读一个单词（按空白分隔）
        String line = sc.nextLine();          // 读一整行（含空格，到换行符）

        // 2. 读一行数组（空格分隔）
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

        // 3. 读 n 行
        for (int i = 0; i < n; i++) {
            int a = sc.nextInt(), b = sc.nextInt();
            System.out.println(a + b);
        }

        // 4. 读到 EOF（ACM 多组数据）
        while (sc.hasNextInt()) {
            int v = sc.nextInt();
            // ...
        }

        sc.close();
    }
}
```

**Scanner 常见坑**：

- `nextInt()` 之后再 `nextLine()`，会读到空字符串（因为 `nextInt` 不消费换行）。混用时在 `nextInt` 后多调一次 `sc.nextLine()` 吃掉换行。
- 大数据（10⁵ 行以上）必超时，立即换下面的 BufferedReader 模板。

### 快读快写模板（BufferedReader / PrintWriter，大数据/ACM 必备）

数据量 ≥ 10⁵ 时，`Scanner` 会从 "刚刚好" 变 "TLE"。换 `BufferedReader + StringTokenizer + PrintWriter` 通常能快 10 倍以上。

```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        PrintWriter writer = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));

        // 读第一行：n m
        StringTokenizer st = new StringTokenizer(reader.readLine());
        int n = Integer.parseInt(st.nextToken());
        int m = Integer.parseInt(st.nextToken());

        // 读 n 行数组
        int[] arr = new int[n];
        st = new StringTokenizer(reader.readLine());
        for (int i = 0; i < n; i++) arr[i] = Integer.parseInt(st.nextToken());

        // 输出（必须 flush 否则可能丢数据）
        writer.println(n + m);
        writer.flush();
    }
}
```

**选型一句话**：

| 场景 | 用哪个 |
|------|------|
| LeetCode / 力扣 / 函数式输入 | **都不用**，方法签名直接给参数 |
| 学习算法 / ACM 小数据（< 10⁵）| **Scanner** |
| ACM 大数据（≥ 10⁵）/ 牛客 / Codeforces | **BufferedReader + PrintWriter** |

### 数组与排序

```java
int[] nums = {4, 2, 7, 1, 3};

// === 创建与初始化 ===
int[] a = new int[10];                              // 长度 10，默认全 0
int[] b = {1, 2, 3};                                // 字面量初始化
int[] c = Arrays.copyOf(nums, nums.length);         // 完整拷贝（深拷贝一维数组）
int[] d = Arrays.copyOfRange(nums, 1, 4);           // 拷贝下标 [1, 4)（左闭右开）—— {2, 7, 1}
int[][] grid = new int[m][n];                       // 二维数组，默认全 0
Arrays.fill(a, -1);                                 // 全部填 -1
Arrays.fill(a, 2, 5, 9);                            // 下标 [2, 5) 填 9

// === 排序 ===
Arrays.sort(nums);                                  // 升序，O(n log n)，原地修改
Arrays.sort(nums, 1, 4);                            // 部分排序：[1, 4) 区间
// ⚠️ 基本类型 int[] 不能用 Comparator；要降序请装箱
Integer[] boxed = {4, 2, 7, 1};
Arrays.sort(boxed, (x, y) -> y - x);                // 降序（注意 x - y 可能溢出，建议 Integer.compare(y, x)）
Arrays.sort(boxed, Comparator.reverseOrder());      // 等价写法

// === 查找（要求已排序）===
int idx = Arrays.binarySearch(nums, 7);             // 找到返回下标；找不到返回 -(插入点+1)

// === 转换 ===
List<Integer> list = Arrays.asList(1, 2, 3);        // ⚠️ 固定大小，不能 add/remove，不能传 int[]
List<Integer> list2 = new ArrayList<>(Arrays.asList(1, 2, 3));  // 可变 List
int[] backToArr = list2.stream().mapToInt(Integer::intValue).toArray();  // List<Integer> → int[]
String joined = Arrays.toString(nums);              // 调试打印：[1, 2, 3, 4, 7]
String deep = Arrays.deepToString(grid);            // 二维数组调试打印

// === 流式聚合（小数据可用，不要在热点路径用）===
int sum = Arrays.stream(nums).sum();                // 求和
int max = Arrays.stream(nums).max().getAsInt();     // 最大
int min = Arrays.stream(nums).min().getAsInt();     // 最小
double avg = Arrays.stream(nums).average().getAsDouble();  // 平均
```

::: warning ⚠️ 必踩坑
- `Arrays.asList(int[] arr)` 会得到 `List<int[]>`（长度 1），**而不是 `List<Integer>`**。要装箱后再用。
- 二维数组拷贝：`Arrays.copyOf(grid, grid.length)` 是浅拷贝，行还是同一引用；深拷贝要逐行拷贝。
- 排序降序时用 `Integer.compare(y, x)` 而非 `y - x`（避免 `Integer.MIN_VALUE` 溢出）。
:::

### 字符串处理

```java
String s = "abcde";

// === 读取与切分 ===
char ch = s.charAt(2);                              // 取第 3 个字符 'c'
int len = s.length();                               // 字符串长度（不是 length()，String 是属性写法但仍是方法）
String sub = s.substring(1, 4);                     // 子串 [1, 4) → "bcd"（左闭右开）
String sub2 = s.substring(2);                       // 从下标 2 到末尾 → "cde"
char[] arr = s.toCharArray();                       // 转 char[]
String joined = new String(arr);                    // char[] → String
String join2 = String.valueOf(arr);                 // 等价；也可 String.valueOf(int / boolean / Object ...)

// === 查找 ===
int idx = s.indexOf('c');                           // 第一次出现的下标；找不到返回 -1
int idx2 = s.indexOf("bc");                         // 子串搜索
int idx3 = s.indexOf('c', 3);                       // 从下标 3 开始搜
int last = s.lastIndexOf('c');                      // 最后一次出现
boolean has = s.contains("bc");                     // 是否包含
boolean start = s.startsWith("ab");                 // 前缀
boolean end = s.endsWith("de");                     // 后缀

// === 大小写、去空格、判空 ===
String up = s.toUpperCase();                        // 全大写
String low = s.toLowerCase();                       // 全小写
String trimmed = "  hi  ".trim();                   // 去首尾空白 → "hi"
String stripped = "  hi  ".strip();                 // JDK 11+，支持 Unicode 空白
boolean isEmpty = s.isEmpty();                      // 长度为 0
boolean isBlank = " ".isBlank();                    // JDK 11+，只含空白也算 true

// === 替换、切分、拼接 ===
String r1 = s.replace('a', 'X');                    // 替换全部字符
String r2 = s.replace("ab", "XY");                  // 替换子串
String r3 = s.replaceAll("[aeiou]", "*");           // 正则替换
String[] parts = "a,b,c".split(",");                // 切分（参数是正则）
String[] limit = "a,b,c,d".split(",", 2);           // 最多分成 2 段 → ["a", "b,c,d"]
String csv = String.join(",", "a", "b", "c");       // 用分隔符拼接 → "a,b,c"
String csv2 = String.join("-", parts);              // 也支持数组/集合

// === 比较 ===
boolean eq = s.equals("abcde");                     // ⚠️ 字符串比较永远用 equals，不能用 ==
boolean iEq = s.equalsIgnoreCase("ABCDE");          // 忽略大小写
int cmp = s.compareTo("abcdf");                     // 字典序比较：< 0 / 0 / > 0

// === StringBuilder（拼接性能必备）===
StringBuilder sb = new StringBuilder();
sb.append("ab").append(12).append(true);            // 链式追加，可接任意基本类型/对象
sb.insert(0, "X");                                  // 在下标 0 处插入
sb.deleteCharAt(0);                                 // 删除指定下标
sb.delete(0, 2);                                    // 删除区间 [0, 2)
sb.reverse();                                       // 原地反转
sb.setCharAt(1, 'Z');                               // 修改单个字符
char c0 = sb.charAt(0);                             // 读字符
String result = sb.toString();                      // 转回 String
sb.setLength(0);                                    // 清空（保留容量）

// === 字符工具（Character 静态方法）===
Character.isDigit('5');                             // 是数字
Character.isLetter('a');                            // 是字母
Character.isLetterOrDigit('a');                     // 是字母或数字
Character.isUpperCase('A');                         // 是大写
Character.isLowerCase('a');                         // 是小写
Character.isWhitespace(' ');                        // 是空白
Character.toLowerCase('A');                         // 转小写
Character.toUpperCase('a');                         // 转大写
int digit = Character.getNumericValue('5');         // 字符 '5' → 数字 5；也可 ('5' - '0')
char digitChar = (char) ('0' + 5);                  // 数字 5 → 字符 '5'

// === 数字 ↔ 字符串 ===
int n = Integer.parseInt("123");                    // 字符串 → int
long ll = Long.parseLong("12345678900");
int hex = Integer.parseInt("ff", 16);               // 进制转换
String s1 = Integer.toString(123);                  // int → 字符串
String s2 = Integer.toBinaryString(10);             // 二进制字符串 "1010"
String s3 = String.format("%03d", 7);               // 格式化 → "007"
```

::: warning ⚠️ 必踩坑
- **String 不可变**：`s.replace(...)` 返回新串，原串不变。
- **`==` 比较的是引用**，永远用 `.equals()`。
- **`split` 第一个参数是正则**：`split(".")` 等于切所有字符，要写 `split("\\.")`。
- **`StringBuilder` 不是线程安全**；多线程才用 `StringBuffer`（刷题永远用 `StringBuilder`）。
- 频繁字符串拼接（n 次 `+`）是 **O(n²)**，循环里必须用 `StringBuilder`。
:::

### List / ArrayList

**ArrayList** 是 Java 刷题用得最多的"动态数组"：底层一根 `Object[]`，元素按下标随机访问 `O(1)`、末尾追加均摊 `O(1)`、中间插入/删除 `O(n)`。**它就是数组的可变长封装**，几乎所有需要"长度不固定的数组"场景都用它（DFS 回溯收集路径、分组、邻接表、按行存二维结果）。

- **vs 数组 `int[]`**：数组长度定死、性能极致、但要装箱才能放进集合；`ArrayList` 长度自动扩容（每次 1.5×），但只能存 `Integer` 等包装类型，**不能直接存 `int`**。
- **vs `LinkedList`**：刷题**永远用 `ArrayList`**——`LinkedList` 的 `get(i)` 是 `O(n)`，缓存不友好，几乎一无是处。需要双端队列用 `ArrayDeque`，不用 `LinkedList`。
- **初始容量**：能预估大小时给 `new ArrayList<>(n)`，避免反复扩容；默认初始容量 10。

```java
List<Integer> list = new ArrayList<>();             // 默认容量 10
List<Integer> list2 = new ArrayList<>(1024);        // ★ 预知大小先给容量，避免多次扩容拷贝

// === 增 ===
list.add(1);                                        // 末尾追加，O(1) 均摊
list.add(0, 99);                                    // 在下标 0 插入，O(n)
list.addAll(Arrays.asList(2, 3, 4));                // 批量加
list.addAll(0, Arrays.asList(7, 8));                // 在指定位置批量插入

// === 删 ===
list.remove(0);                                     // ⚠️ 按下标删 (int)
list.remove(Integer.valueOf(99));                   // ⚠️ 按值删 (Object) —— 装箱区分
list.removeIf(x -> x % 2 == 0);                     // ★ 条件删（边遍历边删的正确姿势）
list.clear();                                       // 清空

// === 查 / 改 ===
int v = list.get(0);                                // 读 O(1)
list.set(0, 100);                                   // 写 O(1)
boolean has = list.contains(2);                     // O(n)
int idx = list.indexOf(3);                          // O(n)，找不到 -1
int last = list.lastIndexOf(3);                     // 最后一次出现
int size = list.size();
boolean empty = list.isEmpty();

// === 切片（视图，不是拷贝）===
List<Integer> view = list.subList(1, 4);            // ⚠️ 共享底层数组，改 view 会改 list
List<Integer> slice = new ArrayList<>(list.subList(1, 4));  // 要独立副本必须再 new 一次

// === 遍历 ===
for (int x : list) { /* ... */ }                    // 增强 for（最常用）
for (int i = 0; i < list.size(); i++) { /* ... */ }
list.forEach(x -> System.out.println(x));           // Lambda
// ⚠️ 增强 for 中调 list.remove(x) 会抛 ConcurrentModificationException，要用 Iterator 或 removeIf

// === 排序 ===
Collections.sort(list);                             // 升序
list.sort(null);                                    // 等价，原生比较器
list.sort((a, b) -> b - a);                         // 降序（小心溢出，建议 Integer.compare(b, a)）
Collections.reverse(list);                          // 反转
Collections.shuffle(list);                          // 随机打乱（写洗牌算法验证用）

// === 二维 List（DFS 回溯结果集 / 邻接表标配）===
List<List<Integer>> res = new ArrayList<>();
res.add(new ArrayList<>(path));                     // ★ 回溯收集结果必须深拷贝 path，否则全是同一引用
List<List<Integer>> graph = new ArrayList<>();
for (int i = 0; i < n; i++) graph.add(new ArrayList<>());   // 邻接表初始化

// === 不可变 List（JDK 9+，常用作常量）===
List<Integer> fixed = List.of(1, 2, 3);             // 不可修改，调 add 抛异常
```

### 数组 ↔ ArrayList 互转（必背 · 刷题高频）

::: tip 💡 一句话定位
LeetCode 大量题面给你 `int[]`，内部要用 `List`，结果集又常常是 `List<int[]>` 或 `int[][]`——**三者互转没有统一 API**。**背下面这张表 + 4 大坑即可，不用记原理**。
:::

#### 最简洁写法速查表（背这一张就够）

| 转换 | 最简洁写法 |
|------|-----------|
| **`int[] → List<Integer>`**（不可变） | `Arrays.stream(nums).boxed().toList()`（JDK 16+） |
| `int[] → ArrayList<Integer>`（可变）| `new ArrayList<>(Arrays.stream(nums).boxed().toList())` |
| **`Integer[] → List<Integer>`**（可变） | `new ArrayList<>(List.of(arr))` |
| **`List<Integer> → int[]`** | `list.stream().mapToInt(Integer::intValue).toArray()` ← **唯一解** |
| **`List<Integer> → Integer[]`** | `list.toArray(new Integer[0])` 或 `list.toArray(Integer[]::new)` |
| **★ `List<int[]> → int[][]`** | **`rows.toArray(new int[0][])`** ← **区间题必背** |
| `int[][] → List<int[]>` | `Arrays.stream(grid).collect(Collectors.toList())` |
| **`int[] → Integer[]`** | `Arrays.stream(nums).boxed().toArray(Integer[]::new)` |
| **`Integer[] → int[]`** | `Arrays.stream(arr).mapToInt(Integer::intValue).toArray()` |
| **`String[] → List<String>`**（可变） | `new ArrayList<>(List.of(arr))` |
| **`List<String> → String[]`** | `list.toArray(new String[0])` |
| **可变参数 → 不可变 List** | `List.of(1, 2, 3)` |
| **可变参数 → ArrayList** | `new ArrayList<>(List.of(1, 2, 3))` |
| **`int[] → Set<Integer>`**（去重） | `Arrays.stream(nums).boxed().collect(Collectors.toSet())` |
| **`int[]` 求和 / 最大 / 最小** | `Arrays.stream(nums).sum()` / `.max().getAsInt()` / `.min().getAsInt()` |
| **`int[]` 调试打印** | `Arrays.toString(nums)` → `"[1, 2, 3]"` |
| **`int[][]` 调试打印** | `Arrays.deepToString(grid)` |
| **`Collection` 拼接** | `String.join(",", list)`（元素是 String） |

#### 4 大避坑（必背）

::: warning ⚠️ 这 4 个错你写过至少 2 个
1. **`Arrays.asList(int[])` 是 `List<int[]>`**——基本类型不会展开装箱；只能用 `Arrays.stream(nums).boxed()...`
2. **`list.toArray()` 返回 `Object[]`**——不能强转 `int[][]` / `String[]`；必须传 `toArray(new T[0])`
3. **`List<List<Integer>>` 不能直接 `toArray(new int[0][])`**——会抛 `ArrayStoreException`（内层是 `List` 不是 `int[]`）；得 stream + `mapToInt` 转一层：
   ```java
   int[][] arr = list.stream()
       .map(r -> r.stream().mapToInt(Integer::intValue).toArray())
       .toArray(int[][]::new);
   ```
4. **`Arrays.asList(1,2,3)` / `List.of(...)` 是固定大小**——`add`/`remove` 抛 `UnsupportedOperationException`；要可变就外面包 `new ArrayList<>(...)`
:::

#### `toArray(new T[0])` 为什么传 0

不是浪费——`toArray` **忽略传入数组的长度**，按 List 实际大小**重新分配**返回。传 `new T[0]` 是 JVM 推荐写法，**JIT 内联后比传 `new T[list.size()]` 还快**。**唯一例外**：传入数组比 List 大时会复用并把剩余位置填 `null`——所以刷题永远传 0。

### 排序模式速查（一维 / 二维 / 字符串 / 字符）

::: tip 💡 排序题型口诀
**「基本类型 `int[]` 只能升序、要降序就装箱」、「二维数组按列排用 `Comparator.comparingInt(a -> a[col])`」、「字符串内部字符排序 = `toCharArray + sort + new String`」**——这三个套路覆盖 80% 排序题。
:::

#### 1. 一维数组排序

```java
// === 基本类型 int[] ===
int[] nums = {4, 2, 7, 1, 3};
Arrays.sort(nums);                                       // 升序（原地，O(n log n) Dual-Pivot QuickSort）
Arrays.sort(nums, 1, 4);                                 // 部分排序：[1, 4)

// ⚠️ int[] 不能直接降序！要么装箱要么手动反转
// 方案 A：装箱
Integer[] boxed = Arrays.stream(nums).boxed().toArray(Integer[]::new);
Arrays.sort(boxed, Comparator.reverseOrder());           // 降序
int[] desc = Arrays.stream(boxed).mapToInt(Integer::intValue).toArray();

// 方案 B：升序后反转（更省内存）
Arrays.sort(nums);
for (int i = 0, j = nums.length - 1; i < j; i++, j--) {
    int t = nums[i]; nums[i] = nums[j]; nums[j] = t;
}

// === 包装类型 Integer[] / String[]（可直接用 Comparator）===
Integer[] arr = {4, 2, 7, 1, 3};
Arrays.sort(arr);                                        // 升序
Arrays.sort(arr, (a, b) -> b - a);                       // ⚠️ 溢出风险（Integer.MIN_VALUE）
Arrays.sort(arr, (a, b) -> Integer.compare(b, a));       // ★ 安全的降序写法
Arrays.sort(arr, Comparator.reverseOrder());             // 等价

String[] words = {"banana", "apple", "cherry"};
Arrays.sort(words);                                      // 字典序升序
Arrays.sort(words, Comparator.reverseOrder());           // 字典序降序
Arrays.sort(words, Comparator.comparingInt(String::length));  // 按长度升序
Arrays.sort(words, (a, b) -> a.length() != b.length()
    ? a.length() - b.length() : a.compareTo(b));         // 长度升序 → 字典序（多级排序）
```

#### 2. 二维数组排序（区间 / 会议室 / 排程必考）

二维数组 `int[][]` 排序是 **LeetCode 56/57/452/1235** 等区间题的核心套路。**`Arrays.sort(int[][], Comparator)` 是允许的**——虽然基本类型一维不能用 Comparator，但**二维数组的元素是 `int[]`（引用类型）**，所以可以传 Comparator。

```java
int[][] intervals = {{1, 3}, {2, 6}, {8, 10}, {15, 18}};

// === 按第 0 列升序（区间起点排序）===
Arrays.sort(intervals, (a, b) -> a[0] - b[0]);            // ⚠️ 小心溢出
Arrays.sort(intervals, Comparator.comparingInt(a -> a[0]));  // ★ 推荐写法

// === 按第 1 列升序（区间终点排序，活动选择问题）===
Arrays.sort(intervals, Comparator.comparingInt(a -> a[1]));

// === 多级排序（先按起点升序，相同则按终点降序）===
Arrays.sort(intervals, (a, b) -> a[0] != b[0]
    ? Integer.compare(a[0], b[0])
    : Integer.compare(b[1], a[1]));

// 等价的链式写法（更易读）
Arrays.sort(intervals,
    Comparator.<int[]>comparingInt(a -> a[0])
              .thenComparing((a, b) -> Integer.compare(b[1], a[1])));

// === 降序（用 reversed() 或显式 Comparator）===
Arrays.sort(intervals,
    Comparator.<int[]>comparingInt(a -> a[0]).reversed());

// === long / double 列 ===
double[][] points = ...;
Arrays.sort(points, Comparator.comparingDouble(p -> p[0]));
long[][] tasks = ...;
Arrays.sort(tasks, Comparator.comparingLong(t -> t[0]));
```

::: warning ⚠️ 二维排序经典坑
1. **`(a, b) -> a[0] - b[0]` 在大数下会溢出** → 改 `Integer.compare(a[0], b[0])` 或 `Comparator.comparingInt`
2. **`int[][]` 排序是按 **引用** 整行交换**——不会破坏行内顺序
3. **不可以这样写**：`Arrays.sort(intervals, (a, b) -> a[0] - b[0] != 0 ? a[0] - b[0] : a[1] - b[1])` 在两列都有大值时双重溢出
4. **想要稳定排序**？`Arrays.sort` 对**对象数组**（`int[][]` 算）**是稳定的**（TimSort）；对 `int[]` 基本类型用 Dual-Pivot QuickSort **不稳定**
:::

#### 3. List 排序

```java
List<Integer> list = new ArrayList<>(Arrays.asList(4, 2, 7, 1, 3));

list.sort(null);                                          // 升序，等价 Collections.sort(list)
Collections.sort(list);                                   // 升序（等价）
list.sort((a, b) -> Integer.compare(b, a));               // 降序
list.sort(Comparator.reverseOrder());                     // 等价

// === List<int[]> 排序（与二维数组语法一致）===
List<int[]> intervals = ...;
intervals.sort(Comparator.comparingInt(a -> a[0]));

// === 自定义对象排序 ===
record Person(String name, int age) {}
List<Person> people = ...;
people.sort(Comparator.comparingInt(Person::age));        // 按年龄升序
people.sort(Comparator.comparing(Person::name));          // 按名字字典序
people.sort(Comparator.comparingInt(Person::age)
    .thenComparing(Person::name));                        // 多级排序

// === 反转 / 打乱（生成测试数据用）===
Collections.reverse(list);
Collections.shuffle(list);
Collections.shuffle(list, new Random(42));                // 固定种子可复现
```

#### 4. 字符串排序

字符串排序两个常考场景：**字符串数组按字典序排** / **字符串内部字符排序**（异位词、最小字典序）。

```java
// === 字符串数组排序 ===
String[] words = {"banana", "apple", "cherry"};
Arrays.sort(words);                                       // 字典序（lexicographic）升序
Arrays.sort(words, Comparator.reverseOrder());            // 降序
Arrays.sort(words, Comparator.comparingInt(String::length));   // 按长度
Arrays.sort(words, String.CASE_INSENSITIVE_ORDER);        // 忽略大小写字典序

// === 自定义比较（如"拼接出最大数"LC179）===
String[] nums = {"3", "30", "34", "5", "9"};
Arrays.sort(nums, (a, b) -> (b + a).compareTo(a + b));    // 拼接后比较 → "9534330"

// === 字符串内部字符排序（必背：异位词题 LC242 / 49）===
String s = "cba";
char[] chars = s.toCharArray();
Arrays.sort(chars);                                       // 内部排序
String sorted = new String(chars);                        // "abc"

// 一行写法
String key = s.chars().sorted()
    .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
    .toString();
// 或更简单：
String key2 = Stream.of(s.split(""))
    .sorted().collect(Collectors.joining());

// === 按字符频次排序（LC451）===
Map<Character, Integer> cnt = new HashMap<>();
for (char c : s.toCharArray()) cnt.merge(c, 1, Integer::sum);
StringBuilder sb = new StringBuilder();
cnt.entrySet().stream()
    .sorted((a, b) -> b.getValue() - a.getValue())        // 按频次降序
    .forEach(e -> { for (int i = 0; i < e.getValue(); i++) sb.append(e.getKey()); });

// === 字符数组排序 ===
char[] chs = {'c', 'a', 'b'};
Arrays.sort(chs);                                         // 升序
// char[] 没有 Comparator 重载；要降序排数组用：
Character[] boxed = {'c', 'a', 'b'};
Arrays.sort(boxed, Comparator.reverseOrder());            // 降序
```

::: tip 💡 字符串排序速记
- **异位词分组**：把每个字符串 `toCharArray + sort + new String` 作为 HashMap 的 key
- **拼接最大数**：`(b + a).compareTo(a + b)`
- **按字符频次**：HashMap 统计 + entrySet 排序
- **`String.CASE_INSENSITIVE_ORDER`**：忽略大小写的内置 Comparator
:::

#### 5. Comparator 速查

| 写法 | 用途 |
|------|------|
| `Comparator.naturalOrder()` | 自然顺序（升序） |
| `Comparator.reverseOrder()` | 反向 |
| `Comparator.comparingInt(x -> x[0])` | 抽取 int 字段 |
| `Comparator.comparing(Person::name)` | 抽取对象字段 |
| `c.thenComparing(...)` | 多级排序 |
| `c.reversed()` | 反转已有 Comparator |
| `Comparator.nullsFirst(c)` | null 排在前 |
| `Comparator.nullsLast(c)` | null 排在后 |

#### 6. 排序复杂度与稳定性

| 方法 | 实现 | 时间 | 稳定性 |
|------|------|------|--------|
| `Arrays.sort(int[])` | Dual-Pivot QuickSort | O(n log n) 均摊；最坏 O(n²) | ❌ **不稳定** |
| `Arrays.sort(Object[])` | TimSort | O(n log n) | ✅ **稳定** |
| `Arrays.sort(int[][])` | TimSort（按引用）| O(n log n) | ✅ 稳定 |
| `Collections.sort(List)` | TimSort | O(n log n) | ✅ 稳定 |
| `list.sort(Comparator)` | TimSort | O(n log n) | ✅ 稳定 |
| `Arrays.parallelSort(...)` | 并行归并 | O(n log n) / p 核 | ✅ 稳定 |

**结论**：刷题需要稳定排序时（比如多关键字、保留原顺序），**包装类型版本**自动稳定；**`int[]` 不稳定**——但刷题用 `int[]` 的场景几乎不在乎稳定性（值就是值）。

### 哈希表 HashMap 与 HashSet

```java
// === HashMap：键值映射 ===
Map<String, Integer> map = new HashMap<>();

map.put("a", 1);                                    // 写入
map.putIfAbsent("a", 2);                            // 不存在才写
int v = map.get("a");                               // 读；找不到返回 null（⚠️ 装箱 NPE）
int v2 = map.getOrDefault("b", 0);                  // ★ 找不到给默认值（计数题常用）
boolean has = map.containsKey("a");
boolean hasV = map.containsValue(1);                // O(n)，少用
map.remove("a");
int size = map.size();

// === 频次统计三种写法（推荐第三种）===
map.put("a", map.getOrDefault("a", 0) + 1);         // ① getOrDefault
map.merge("a", 1, Integer::sum);                    // ② merge（更短）
map.computeIfAbsent("a", k -> 0);                   // ③ 初始化默认值

// === 分组（List value 常用）===
Map<Character, List<Integer>> groups = new HashMap<>();
groups.computeIfAbsent('a', k -> new ArrayList<>()).add(1);  // ★ 自动初始化空 List 再 add

// === 遍历 ===
for (Map.Entry<String, Integer> e : map.entrySet()) {
    String k = e.getKey();
    int val = e.getValue();
}
for (String k : map.keySet()) { /* ... */ }
for (int val : map.values()) { /* ... */ }
map.forEach((k, val) -> System.out.println(k + "=" + val));

// === HashSet：去重 / 是否存在 O(1) ===
Set<Integer> set = new HashSet<>();
set.add(1);
set.remove(1);
boolean exists = set.contains(1);
set.addAll(Arrays.asList(1, 2, 3));
Set<Integer> copy = new HashSet<>(set);             // 拷贝
int size2 = set.size();
```

::: tip 💡 类型选择
- **HashMap / HashSet** — 无序，O(1)，绝大多数题首选。
- **LinkedHashMap / LinkedHashSet** — 按插入顺序遍历，**LRU 缓存** 实现基础。
- **TreeMap / TreeSet** — 红黑树，**有序**，O(log n)，支持 `floor/ceiling/firstKey/lastKey`。
:::

### TreeMap / TreeSet（有序集合）

```java
TreeMap<Integer, String> tm = new TreeMap<>();
tm.put(3, "c"); tm.put(1, "a"); tm.put(5, "e");

// === 有序导航 ===
Map.Entry<Integer, String> first = tm.firstEntry();  // 最小键（key=1）
Map.Entry<Integer, String> last = tm.lastEntry();    // 最大键（key=5）
Integer floor = tm.floorKey(4);                     // ≤ 4 的最大键 → 3
Integer ceil = tm.ceilingKey(4);                    // ≥ 4 的最小键 → 5
Integer lower = tm.lowerKey(3);                     // < 3 的最大键 → 1
Integer higher = tm.higherKey(3);                   // > 3 的最小键 → 5

// === 区间视图（不拷贝，零开销）===
SortedMap<Integer, String> sub = tm.subMap(1, 5);   // [1, 5)
SortedMap<Integer, String> head = tm.headMap(3);    // < 3
SortedMap<Integer, String> tail = tm.tailMap(3);    // ≥ 3

// === TreeSet（同款 API）===
TreeSet<Integer> ts = new TreeSet<>();
ts.add(3); ts.add(1); ts.add(5);
Integer f = ts.first();                             // 最小
Integer l = ts.last();                              // 最大
Integer fl = ts.floor(4);                           // ≤ 4 的最大
Integer cl = ts.ceiling(4);                         // ≥ 4 的最小

// === 典型题：滑动窗口最大值/最小值（TreeMap 计数版）、日程表（区间冲突检测）===
```

### 栈、队列、双端队列

::: tip 💡 一句话选型
**永远用 `ArrayDeque`，不要用 `Stack`！** `Stack` 继承 `Vector`，方法都同步，性能差；`ArrayDeque` 既能当栈又能当队列，速度还快 3-5 倍。
:::

```java
// === 栈（用 ArrayDeque）===
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);                                      // 入栈（等价 addFirst）
stack.push(2);
int top = stack.peek();                             // 取栈顶不弹出（等价 peekFirst）
int pop = stack.pop();                              // 弹出（等价 pollFirst）
boolean empty = stack.isEmpty();
int size = stack.size();

// === 队列（用 ArrayDeque）===
Deque<Integer> queue = new ArrayDeque<>();
queue.offer(10);                                    // 入队尾（等价 offerLast）
queue.offer(20);
int front = queue.peek();                           // 取队首不弹（等价 peekFirst）
int poll = queue.poll();                            // 出队首（等价 pollFirst）

// === 双端队列（单调队列必用）===
Deque<Integer> dq = new ArrayDeque<>();
dq.offerFirst(1);                                   // 队首加
dq.offerLast(2);                                    // 队尾加
dq.peekFirst();
dq.peekLast();
dq.pollFirst();
dq.pollLast();

// === LinkedList 也可以当队列（API 相同），但缓存命中率低，慢于 ArrayDeque ===

// === 阻塞队列（多线程用，刷题极少）===
// Queue<Integer> bq = new ArrayBlockingQueue<>(10);
```

**API 对照速记**：

| 操作 | 推荐方法 | 失败行为 | 等价别名 |
|------|--------|--------|--------|
| 入栈 / 入队 | `push` / `offer` | 满返回 false | `addFirst` / `offerLast` |
| 出栈 / 出队 | `pop` / `poll` | 空抛异常 / 返回 null | `pollFirst` |
| 取栈顶 / 队首 | `peek` | 空返回 null | `peekFirst` |

### 堆与优先队列

```java
// === 小顶堆（默认）===
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5);                                   // O(log n)
minHeap.offer(1);
int smallest = minHeap.peek();                      // 堆顶 O(1)
int popMin = minHeap.poll();                        // 弹出堆顶 O(log n)
int size = minHeap.size();

// === 大顶堆 ===
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
// 或 (a, b) -> Integer.compare(b, a)
// ⚠️ 不要写 (a, b) -> b - a —— 当 a/b 为 Integer.MIN_VALUE 时溢出

// === 自定义对象排序（按距离升序）===
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
pq.offer(new int[]{3, 100});
pq.offer(new int[]{1, 200});
int[] cur = pq.poll();                              // {1, 200}

// === 多字段排序 ===
PriorityQueue<int[]> pq2 = new PriorityQueue<>(
    (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]
);
// 或链式：Comparator.comparingInt((int[] x) -> x[0]).thenComparingInt(x -> x[1])

// === 批量建堆（O(n)，比逐个 offer 的 O(n log n) 快）===
PriorityQueue<Integer> heap = new PriorityQueue<>(Arrays.asList(5, 1, 3, 2, 4));

// === Top K 模板（K 个最大 → 维护小顶堆，超过 K 时弹出堆顶）===
PriorityQueue<Integer> topK = new PriorityQueue<>();
int k = 3;
for (int x : nums) {
    topK.offer(x);
    if (topK.size() > k) topK.poll();
}
// 此时 topK 里就是 K 个最大值，堆顶是第 K 大

// === ⚠️ PriorityQueue 不能高效更新已存在元素 ===
// 想"删除指定值" / "改键值优先级" → 用 TreeMap / 索引堆 / 懒删除
```

### 位运算（高频技巧）

```java
int a = 12, b = 10;
int and = a & b;                                    // 按位与
int or = a | b;                                     // 按位或
int xor = a ^ b;                                    // 按位异或（找单个不重复数）
int not = ~a;                                       // 按位非
int shl = a << 2;                                   // 左移（= ×4）
int shr = a >> 2;                                   // 算术右移（保留符号）
int ushr = a >>> 2;                                 // 逻辑右移（高位补 0）

// === 常用技巧 ===
boolean isEven = (a & 1) == 0;                      // 偶数判断
int lowBit = a & -a;                                // 最低位的 1（树状数组核心）
int turnOff = a & (a - 1);                          // 去掉最低位的 1（统计 1 的个数）
int bits = Integer.bitCount(a);                     // 二进制中 1 的个数
int leadZeros = Integer.numberOfLeadingZeros(a);    // 前导 0 个数
int trailZeros = Integer.numberOfTrailingZeros(a);  // 末尾 0 个数
int highBit = Integer.highestOneBit(a);             // 最高位的 1 对应的数（log 用）

// === 子集枚举 ===
int n = 4;
for (int mask = 0; mask < (1 << n); mask++) {       // 枚举 [0, 2^n) 的所有子集
    for (int i = 0; i < n; i++) {
        if ((mask & (1 << i)) != 0) {               // 第 i 位被选中
            // ...
        }
    }
}
```

### 数学与边界常量

```java
int maxI = Integer.MAX_VALUE;                       // 2^31 - 1 ≈ 2.1×10^9
int minI = Integer.MIN_VALUE;                       // -2^31
long maxL = Long.MAX_VALUE;                         // 9.2×10^18
double inf = Double.POSITIVE_INFINITY;
double nan = Double.NaN;

Math.max(a, b); Math.min(a, b);                     // 最大 / 最小
Math.abs(-5);                                       // 绝对值（⚠️ Math.abs(Integer.MIN_VALUE) 仍是负数）
Math.pow(2, 10);                                    // 幂（返回 double）
Math.sqrt(16);                                      // 开方
Math.log(Math.E); Math.log10(100); Math.log(8) / Math.log(2);  // 对数
Math.ceil(3.2); Math.floor(3.8); Math.round(3.5);   // 上/下取整 / 四舍五入
Math.floorDiv(-7, 2);                               // 向下整除（Java / 默认是向 0 截断）→ -4
Math.floorMod(-7, 3);                               // 数学模（结果永远非负）→ 2

int gcd = BigInteger.valueOf(12).gcd(BigInteger.valueOf(18)).intValue();  // GCD
// 或手写：int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
```

### Comparator 写法速查

```java
// === 按 int 字段升序 ===
list.sort((a, b) -> a - b);                         // ⚠️ 仅当无溢出风险
list.sort(Comparator.comparingInt(x -> x));         // ★ 推荐，无溢出
list.sort(Integer::compare);                        // 等价

// === 降序 ===
list.sort((a, b) -> b - a);                         // ⚠️ 同上
list.sort(Comparator.reverseOrder());               // ★ 推荐
list.sort(Comparator.comparingInt((Integer x) -> x).reversed());

// === 多字段（先按第 0 列升序，再按第 1 列降序）===
Arrays.sort(arr2d, (a, b) -> a[0] != b[0] ? a[0] - b[0] : b[1] - a[1]);
Arrays.sort(arr2d,
    Comparator.<int[]>comparingInt(a -> a[0])
              .thenComparing((a, b) -> b[1] - a[1]));
```

## 典型实例

| 场景 | 常用命令 | 典型题 |
|------|------|------|
| 频次统计 | `HashMap` + `getOrDefault` / `merge` | 两数之和、字母异位词分组、出现次数前 K 高 |
| 去重 / 查询是否存在 | `HashSet` | 最长无重复子串、快乐数 |
| 按插入序遍历 | `LinkedHashMap` / `LinkedHashSet` | LRU 缓存 |
| 范围查询 / 找上下界 | `TreeMap` / `TreeSet` (`floor` / `ceiling`) | 日程表、滑动窗口最大值、股票价格波动 |
| 分组聚合 | `HashMap<K, List<V>>` + `computeIfAbsent` | 异位词分组、按起点分组的区间 |
| 单调栈 / 单调队列 | `ArrayDeque` | 每日温度、接雨水、柱状图最大矩形、滑动窗口最大值 |
| Top K / 堆排序 | `PriorityQueue`（大小为 K） | 第 K 大元素、合并 K 个排序链表 |
| 中位数（双堆）| 大顶堆 + 小顶堆 | 数据流中位数 |
| 二分 / 查找下标 | `Arrays.binarySearch` / 手写 lowerBound | 搜索旋转排序数组 |
| 多维数据排序 | `Arrays.sort(arr2d, Comparator)` | 合并区间、最少箭射气球 |
| 字符串拼接 / 反转 | `StringBuilder` | 反转字符串、Z 字形变换 |
| 位运算技巧 | `^` / `& -x` / `bitCount` | 只出现一次的数、子集枚举、汉明距离 |
| 区间和反复查询 | 前缀和（一维数组） | 区间和为 K、连续数组 |

## 刷题时最容易错的点

1. **栈用 `Stack` 而不是 `ArrayDeque`**：`Stack` 同步开销大，慢 3-5 倍，且 API 名字过时。
2. **大输入用 `Scanner`**：10⁵ 行起步必 TLE，立刻换 `BufferedReader + StringTokenizer`。
3. **`PriorityQueue` 比较器用 `b - a` / `a - b`**：当元素接近 `Integer.MIN_VALUE` 时溢出，改用 `Integer.compare(a, b)` 或 `Comparator.reverseOrder()`。
4. **`String` 用 `==` 比较**：永远用 `.equals()`，`==` 比的是引用。
5. **字符串切分 `split(".")`**：参数是正则，会切成所有字符，要写 `split("\\.")`。
6. **`Arrays.asList(int[] arr)` 拿到 `List<int[]>`**：基本类型数组无法直接转 `List<Integer>`，要装箱或用 stream。
7. **`map.get(key)` 直接拆箱**：key 不存在返回 `null`，再赋给 `int` 触发 NPE，应该用 `getOrDefault`。
8. **`Arrays.asList(1, 2, 3)` 固定长度**：调 `add/remove` 抛 `UnsupportedOperationException`，要 `new ArrayList<>(Arrays.asList(...))`。
9. **二维数组浅拷贝**：`Arrays.copyOf(grid, m)` 行引用还是同一个，要逐行 `.clone()`。
10. **循环里用 `String +` 拼接**：O(n²)，必须改 `StringBuilder.append`。
11. **递归层数过深 StackOverflow**：Java 默认栈 512KB，约 1~2 万层；DFS 题数据规模 ≥ 10⁵ 建议改栈式 / 迭代版。
12. **`int * int` 溢出**：当结果可能超 2.1×10⁹ 时，先强转 `(long)a * b` 再运算。

## 关联章节

- [基础算法模板](./basic-templates) — 10 个高频模板的完整代码（二分 / 双指针 / 滑窗 / 前缀和 / 单调栈 / BFS / DFS / 回溯 / 并查集 / 拓扑）
- [高阶算法模板](./advanced-templates) — KMP / Manacher / 树状数组 / 线段树
- [算法技巧](./algorithm-patterns) — 题目特征到方法的映射总表
- [Java 集合框架](../../programming-languages/java-collections) — HashMap / ConcurrentHashMap 源码级原理