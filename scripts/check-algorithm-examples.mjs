import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createMarkdownRenderer } from 'vitepress';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({ options: { 'java-home': { type: 'string' } } });
const javaHome = values['java-home'] ?? process.env.JAVA_HOME;
const executable = name => {
  const filename = process.platform === 'win32' ? `${name}.exe` : name;
  return javaHome ? join(javaHome, 'bin', filename) : filename;
};
const renderer = await createMarkdownRenderer(root);
const cache = new Map();
let extracted = 0;

function snippet(file, marker) {
  if (!cache.has(file)) {
    const source = readFileSync(join(root, 'docs/data-structures-and-algorithms', file), 'utf8');
    cache.set(file, renderer.parse(source, {}).filter(token => token.type === 'fence' && token.info === 'java'));
  }
  const matches = cache.get(file).filter(token => token.content.includes(marker));
  assert.equal(matches.length, 1, `${file}: expected exactly one Java fence containing ${marker}`);
  extracted++;
  return matches[0].content.replace(/^import .+;\s*$/gm, '');
}

const wrap = (name, ...parts) => `class ${name} {\n${parts.join('\n')}\n}`;
const renameSolution = (source, name) => source.replace('class Solution', `class ${name}`);
const basicDifference = snippet('foundations/basic-templates.md', 'd[l] += v;')
  .replace(/\bn\b/g, 'nums.length').replace(/\bl\b/g, 'left')
  .replace(/\br\b/g, 'right').replace(/\bv\b/g, 'value');
const longDifference = snippet('arrays/prefix-sum-difference.md', 'long[] diff = new long[size + 1];')
  .replace(/\bl\b/g, 'left').replace(/\br\b/g, 'right').replace(/\bval\b/g, 'value');
const sources = [
  wrap('DifferenceExamples',
    `public int[] apply(int[] nums, int left, int right, int value) {\n${basicDifference}\nreturn result;\n}`,
    `public long[] applyLong(int[] nums, int left, int right, int value) {\n${longDifference}\nreturn result;\n}`),
  snippet('foundations/advanced-templates.md', 'public class BIT').replace('public class BIT', 'class BIT'),
  snippet('foundations/advanced-templates.md', 'public class Manacher').replace('public class Manacher', 'class Manacher'),
  wrap('InversionExample', snippet('foundations/advanced-templates.md', 'public long reversePairs')),
  wrap('ShortestSubarrayExample', snippet('arrays/prefix-sum-difference.md', 'public int shortestSubarray')),
  wrap('BinaryExamples', ...['public int binarySearch', 'public int lowerBound', 'public int upperBound']
    .map(marker => snippet('arrays/binary-search.md', marker))),
    wrap('WorkflowBinaryExample', snippet('foundations/problem-solving-workflow.md', 'public static int lowerBound')),
  wrap('WindowExample', snippet('arrays/sliding-window.md', 'public String minWindow')),
  wrap('LisExample', snippet('dynamic-programming/dp-optimization.md', 'public int[] longestIncreasingSubsequence')),
    wrap('GroupKnapsackExample', snippet('dynamic-programming/knapsack-dp.md', 'public int groupKnapsackMaxValue')),
    wrap('LinearDpExamples', ...['public int maxProduct', 'public boolean wordBreak', 'public int maximalSquare', 'public int calculateMinimumHP']
        .map(marker => snippet('dynamic-programming/linear-dp.md', marker))),
    wrap('KnapsackExamples', ...['public int findTargetSumWays', 'public int completeKnapsackMinCoins', 'public int completeKnapsackCountCombinations', 'public int completeKnapsackCountPermutations']
        .map(marker => snippet('dynamic-programming/knapsack-dp.md', marker))),
    wrap('SequenceDpExamples', ...['public int longestCommonSubsequence', 'public BigInteger numDistinctExact']
        .map(marker => snippet('dynamic-programming/sequence-dp.md', marker))),
    'class TreeNode { int val; TreeNode left, right; TreeNode(int value) { val = value; } }',
    renameSolution(snippet('dynamic-programming/tree-dp.md', 'public int maxPathSum'), 'MaximumTreePathExample'),
    renameSolution(snippet('dynamic-programming/tree-dp.md', 'public int rob(TreeNode root)'), 'TreeRobExample'),
  snippet('dynamic-programming/dp-optimization.md', 'class PrefixSumDPExample'),
  renameSolution(snippet('dynamic-programming/dp-optimization.md', 'public int sumSubarrayMins'), 'MinimumsExample'),
  renameSolution(snippet('dynamic-programming/probability-dp.md', 'public double knightProbability('), 'ForwardKnight'),
  snippet('dynamic-programming/probability-dp.md', 'class KnightSurvival'),
  wrap('GraphExamples', ...['public long[] dijkstra', 'public List<Integer> restorePath', 'public int[] zeroOneBfs']
    .map(marker => snippet('graph-search/shortest-path.md', marker))),
  snippet('graph-search/tarjan-scc.md', 'class Tarjan').split('List<List<Integer>> graph = new ArrayList<>();')[0],
  wrap('CycleExample', snippet('graph-search/tarjan-scc.md', 'public boolean hasDirectedCycle')),
  snippet('hash/lfu-cache.md', 'class LFUCache'),
  ...['class TokenBucket {', 'class LeakyBucket {', 'class LeakyBucketShaper {', 'class SlidingWindowCounter {', 'class SlidingWindowLog {']
    .map(marker => snippet('arrays/rate-limiter.md', marker).split('TokenBucket limiter =')[0]),
];

const harness = String.raw`
public class AlgorithmExamplesCheck {
    private static long checks;
    private static final Random random = new Random(20261018);

    private static void check(boolean condition, String message) {
        checks++;
        if (!condition) throw new AssertionError(message);
    }

    private static void invalid(Runnable action) {
        try { action.run(); }
        catch (IllegalArgumentException expected) { checks++; return; }
        throw new AssertionError("expected invalid argument rejection");
    }

    private static int bruteShortest(int[] values, int target) {
        int best = values.length + 1;
        for (int left = 0; left < values.length; left++) {
            long sum = 0;
            for (int right = left; right < values.length; right++) {
                sum += values[right];
                if (sum >= target) best = Math.min(best, right - left + 1);
            }
        }
        return best == values.length + 1 ? -1 : best;
    }

    private static void arrays() {
        DifferenceExamples difference = new DifferenceExamples();
        InversionExample inversions = new InversionExample();
        LisExample lis = new LisExample();
        ShortestSubarrayExample shortest = new ShortestSubarrayExample();
        BinaryExamples binary = new BinaryExamples();
        MinimumsExample minimums = new MinimumsExample();
        check(WorkflowBinaryExample.lowerBound(new int[]{}, 0) == 0, "workflow empty lower bound");
        check(WorkflowBinaryExample.lowerBound(new int[]{Integer.MIN_VALUE, Integer.MAX_VALUE}, Integer.MAX_VALUE) == 1,
            "workflow extreme lower bound");
        check(WorkflowBinaryExample.lowerBound(new int[]{2, 2, 2}, 3) == 3, "workflow missing lower bound");
        check(Arrays.equals(difference.apply(new int[]{1,2,3},0,1,10),new int[]{11,12,3}), "difference regression");
        check(Arrays.equals(difference.applyLong(new int[]{Integer.MIN_VALUE,Integer.MAX_VALUE},0,1,1),
            new long[]{-2147483647L,2147483648L}), "difference long arithmetic");
        check(inversions.reversePairs(new int[]{1,1,1,2}) == 0, "duplicate ranks");
        int[] descending = new int[70000];
        for (int index=0; index<descending.length; index++) descending[index]=descending.length-index;
        check(inversions.reversePairs(descending) == 70000L*69999/2, "inversion long result");
        check(shortest.shortestSubarray(new int[]{1,-1,5},5)==1, "negative window regression");
        check(shortest.shortestSubarray(new int[]{Integer.MAX_VALUE,Integer.MAX_VALUE},Integer.MAX_VALUE)==1, "long prefix");
        check(Arrays.equals(lis.longestIncreasingSubsequence(new int[]{3,5,7,1,2}),new int[]{3,5,7}), "LIS predecessor regression");
        for (int trial=0; trial<1200; trial++) {
            int[] values = new int[random.nextInt(9)];
            for (int index=0; index<values.length; index++) values[index]=random.nextInt(9)-4;
            long expectedInversions=0;
            int[] lengths=new int[values.length];
            Arrays.fill(lengths,1);
            int expectedLength=0;
            for (int right=0; right<values.length; right++) {
                for (int left=0; left<right; left++) {
                    if (values[left]>values[right]) expectedInversions++;
                    if (values[left]<values[right]) lengths[right]=Math.max(lengths[right],lengths[left]+1);
                }
                expectedLength=Math.max(expectedLength,lengths[right]);
            }
            check(inversions.reversePairs(values)==expectedInversions,"inversions "+Arrays.toString(values));
            int[] sequence=lis.longestIncreasingSubsequence(values);
            check(sequence.length==expectedLength,"LIS length");
            int cursor=0;
            for (int index=0; index<sequence.length; index++) {
                if (index>0) check(sequence[index-1]<sequence[index],"LIS strict order");
                while (cursor<values.length && values[cursor]!=sequence[index]) cursor++;
                check(cursor<values.length,"LIS original order");
                cursor++;
            }
            for (int target=1; target<=8; target++) {
                check(shortest.shortestSubarray(values,target)==bruteShortest(values,target),"shortest subarray "+Arrays.toString(values));
            }
            if (values.length>0) {
                int left=random.nextInt(values.length), right=left+random.nextInt(values.length-left), delta=random.nextInt(21)-10;
                int[] expected=values.clone();
                for (int index=left; index<=right; index++) expected[index]+=delta;
                check(Arrays.equals(difference.apply(values,left,right,delta),expected),"range addition");
                check(Arrays.equals(difference.applyLong(values,left,right,delta),Arrays.stream(expected).asLongStream().toArray()),"long range addition");
            }
            int[] sorted=values.clone();
            Arrays.sort(sorted);
            for (int target=-5; target<=5; target++) {
                int lower=0, upper=0;
                while (lower<sorted.length && sorted[lower]<target) lower++;
                while (upper<sorted.length && sorted[upper]<=target) upper++;
                check(binary.lowerBound(sorted,target)==lower,"lower bound");
                check(WorkflowBinaryExample.lowerBound(sorted,target)==lower,"workflow lower bound");
                check(binary.upperBound(sorted,target)==upper-1,"last less-or-equal");
                int found=binary.binarySearch(sorted,target);
                check(found<0 ? lower==upper : sorted[found]==target,"binary search");
            }
            int[] positive=Arrays.stream(values).map(value->value+5).toArray();
            int expectedSum=0;
            for (int left=0; left<positive.length; left++) {
                int minimum=Integer.MAX_VALUE;
                for (int right=left; right<positive.length; right++) {
                    minimum=Math.min(minimum,positive[right]); expectedSum+=minimum;
                }
            }
            check(minimums.sumSubarrayMins(positive)==expectedSum,"minimum contribution");
            StringBuilder text=new StringBuilder();
            for (int value:values) text.append((char)('a'+Math.floorMod(value,3)));
            int longest=0;
            for (int left=0; left<text.length(); left++) for (int right=left+1; right<=text.length(); right++) {
                String candidate=text.substring(left,right);
                if (candidate.equals(new StringBuilder(candidate).reverse().toString())) longest=Math.max(longest,candidate.length());
            }
            String palindrome=Manacher.longestPalindrome(text.toString());
            check(palindrome.length()==longest && text.indexOf(palindrome)>=0
                && palindrome.equals(new StringBuilder(palindrome).reverse().toString()),"Manacher");
        }
        WindowExample windows=new WindowExample();
        check(windows.minWindow("ADOBECODEBANC","ABC").equals("BANC"),"minimum covering window");
        check(windows.minWindow("a","").isEmpty(),"empty target");
        PrefixSumDPExample compositions=new PrefixSumDPExample();
        for (int size=0; size<=256; size++) {
            BigInteger expected=size==0 ? BigInteger.ONE : BigInteger.TWO.pow(size-1);
            check(compositions.countWays(size)==expected.mod(BigInteger.valueOf(1000000007)).longValue(),"composition count");
        }
        invalid(()->compositions.countWays(-1));
    }

    private static boolean bruteWordBreak(String text, int start, List<String> words) {
        if (start == text.length()) return true;
        for (String word : words) {
            if (text.startsWith(word, start) && bruteWordBreak(text, start + word.length(), words)) return true;
        }
        return false;
    }

    private static int bruteSquare(char[][] matrix) {
        int best = 0;
        for (int row = 0; row < matrix.length; row++) {
            for (int column = 0; column < matrix[0].length; column++) {
                for (int side = 1; row + side <= matrix.length && column + side <= matrix[0].length; side++) {
                    boolean allOnes = true;
                    for (int scanRow = row; scanRow < row + side; scanRow++) {
                        for (int scanColumn = column; scanColumn < column + side; scanColumn++) {
                            if (matrix[scanRow][scanColumn] != '1') allOnes = false;
                        }
                    }
                    if (allOnes) best = Math.max(best, side * side);
                }
            }
        }
        return best;
    }

    private static int bruteHealth(int[][] dungeon, int row, int column, int total, int minimum) {
        int nextTotal = total + dungeon[row][column];
        int nextMinimum = Math.min(minimum, nextTotal);
        if (row == dungeon.length - 1 && column == dungeon[0].length - 1) return 1 - nextMinimum;
        int best = Integer.MAX_VALUE;
        if (row + 1 < dungeon.length) best = Math.min(best, bruteHealth(dungeon, row + 1, column, nextTotal, nextMinimum));
        if (column + 1 < dungeon[0].length) best = Math.min(best, bruteHealth(dungeon, row, column + 1, nextTotal, nextMinimum));
        return best;
    }

    private static int bruteSigns(int[] numbers, int position, int sum, int target) {
        if (position == numbers.length) return sum == target ? 1 : 0;
        return bruteSigns(numbers, position + 1, sum + numbers[position], target)
            + bruteSigns(numbers, position + 1, sum - numbers[position], target);
    }

    private static int bruteCoinCombinations(int[] coins, int position, int remaining) {
        if (position == coins.length) return remaining == 0 ? 1 : 0;
        int total = 0;
        for (int used = 0; used * coins[position] <= remaining; used++) {
            total += bruteCoinCombinations(coins, position + 1, remaining - used * coins[position]);
        }
        return total;
    }

    private static int bruteCoinPermutations(int[] coins, int remaining) {
        if (remaining == 0) return 1;
        int total = 0;
        for (int coin : coins) if (coin <= remaining) total += bruteCoinPermutations(coins, remaining - coin);
        return total;
    }

    private static int minimumCoinsBfs(int[] coins, int amount) {
        int[] distance = new int[amount + 1];
        Arrays.fill(distance, -1);
        distance[0] = 0;
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        queue.add(0);
        while (!queue.isEmpty()) {
            int sum = queue.remove();
            for (int coin : coins) {
                int next = sum + coin;
                if (next <= amount && distance[next] == -1) {
                    distance[next] = distance[sum] + 1;
                    queue.add(next);
                }
            }
        }
        return distance[amount];
    }

    private static boolean isSubsequence(String candidate, String target) {
        int matched = 0;
        for (int index = 0; index < target.length() && matched < candidate.length(); index++) {
            if (candidate.charAt(matched) == target.charAt(index)) matched++;
        }
        return matched == candidate.length();
    }

    private static int bruteTreePath(List<TreeNode> nodes) {
        List<List<Integer>> neighbors = new ArrayList<>();
        for (int position = 0; position < nodes.size(); position++) neighbors.add(new ArrayList<>());
        for (int position = 0; position < nodes.size(); position++) {
            TreeNode node = nodes.get(position);
            for (TreeNode child : new TreeNode[]{node.left, node.right}) {
                if (child == null) continue;
                int childIndex = nodes.indexOf(child);
                neighbors.get(position).add(childIndex);
                neighbors.get(childIndex).add(position);
            }
        }
        int best = Integer.MIN_VALUE;
        for (int start = 0; start < nodes.size(); start++) {
            boolean[] visited = new boolean[nodes.size()];
            ArrayDeque<int[]> queue = new ArrayDeque<>();
            queue.add(new int[]{start, nodes.get(start).val});
            visited[start] = true;
            while (!queue.isEmpty()) {
                int[] current = queue.remove();
                best = Math.max(best, current[1]);
                for (int next : neighbors.get(current[0])) {
                    if (visited[next]) continue;
                    visited[next] = true;
                    queue.add(new int[]{next, current[1] + nodes.get(next).val});
                }
            }
        }
        return best;
    }

    private static int bruteTreeRob(List<TreeNode> nodes) {
        int best = 0;
        for (int mask = 0; mask < (1 << nodes.size()); mask++) {
            boolean valid = true;
            int sum = 0;
            for (int position = 0; position < nodes.size(); position++) {
                if ((mask & (1 << position)) == 0) continue;
                TreeNode node = nodes.get(position);
                sum += node.val;
                for (TreeNode child : new TreeNode[]{node.left, node.right}) {
                    if (child != null && (mask & (1 << nodes.indexOf(child))) != 0) valid = false;
                }
            }
            if (valid) best = Math.max(best, sum);
        }
        return best;
    }

    private static void dynamicProgramming() {
        GroupKnapsackExample grouped = new GroupKnapsackExample();
        check(grouped.groupKnapsackMaxValue(List.of(List.of(0, 1)), new int[]{0, 0}, new int[]{3, 5}, 0) == 5,
            "zero-weight items in one group must not combine");
        check(grouped.groupKnapsackMaxValue(List.of(List.of(0, 1), List.of(2)), new int[]{0, 0, 0}, new int[]{3, 5, 7}, 0) == 12,
            "zero-weight choices across different groups may combine");
        check(grouped.groupKnapsackMaxValue(List.of(List.of(0, 1)), new int[]{1, 2}, new int[]{3, 5}, 3) == 5,
            "one item per group");
        LinearDpExamples linear = new LinearDpExamples();
        check(linear.maxProduct(new int[]{-2, 3, -4}) == 24, "negative minimum becomes maximum");
        check(linear.maxProduct(new int[]{-2}) == -2, "nonempty maximum product");
        check(linear.maxProduct(new int[]{-2, 0, -1}) == 0, "zero splits product ranges");
        check(linear.wordBreak("cars", List.of("car", "ca", "rs")), "longest-prefix greedy counterexample");
        check(!linear.wordBreak("catsandog", List.of("cats", "dog", "sand", "and", "cat")), "unreachable suffix");
        check(linear.wordBreak("", List.of()), "empty word-break prefix");
        check(linear.maximalSquare(new char[0][0]) == 0, "empty square grid");
        check(linear.maximalSquare(new char[][]{{'1', '0'}, {'1', '1'}}) == 1, "square needs all three neighbors");
        check(linear.calculateMinimumHP(new int[][]{{-5}}) == 6, "negative final cell");
        check(linear.calculateMinimumHP(new int[][]{{10}}) == 1, "positive final cell");
        check(linear.calculateMinimumHP(new int[][]{{1, -10, 20}, {0, 0, 0}}) == 1, "maximum path sum is not minimum health");
        check(linear.calculateMinimumHP(new int[][]{{-2,-3,3},{-5,-10,1},{10,30,-5}}) == 7, "dungeon known example");
        List<String> candidates = List.of("a", "b", "aa", "ab", "ba", "bb", "aaa", "aab", "aba", "abb", "baa", "bab", "bba", "bbb");
        for (int trial = 0; trial < 400; trial++) {
            int[] values = new int[1 + random.nextInt(7)];
            for (int index = 0; index < values.length; index++) values[index] = random.nextInt(7) - 3;
            int expected = Integer.MIN_VALUE;
            for (int start = 0; start < values.length; start++) {
                int product = 1;
                for (int end = start; end < values.length; end++) {
                    product *= values[end];
                    expected = Math.max(expected, product);
                }
            }
            check(linear.maxProduct(values) == expected, "product versus all contiguous subarrays");
            StringBuilder text = new StringBuilder();
            int length = random.nextInt(9);
            for (int index = 0; index < length; index++) text.append(random.nextBoolean() ? 'a' : 'b');
            List<String> words = new ArrayList<>();
            for (String word : candidates) if (random.nextBoolean()) words.add(word);
            check(linear.wordBreak(text.toString(), words) == bruteWordBreak(text.toString(), 0, words), "word break versus all splits");
            int rows = 1 + random.nextInt(4), columns = 1 + random.nextInt(4);
            char[][] matrix = new char[rows][columns];
            int[][] dungeon = new int[rows][columns];
            for (int row = 0; row < rows; row++) {
                for (int column = 0; column < columns; column++) {
                    matrix[row][column] = random.nextBoolean() ? '1' : '0';
                    dungeon[row][column] = random.nextInt(11) - 5;
                }
            }
            check(linear.maximalSquare(matrix) == bruteSquare(matrix), "square versus direct cell scan");
            check(linear.calculateMinimumHP(dungeon) == bruteHealth(dungeon, 0, 0, 0, 0), "dungeon versus all path prefix minima");
        }
        KnapsackExamples knapsack = new KnapsackExamples();
        SequenceDpExamples sequences = new SequenceDpExamples();
        check(knapsack.findTargetSumWays(new int[]{0, 0, 1}, 1) == 4, "target sum doubles zero choices");
        check(knapsack.findTargetSumWays(new int[20], 0) == 1048576, "all-zero target sum");
        check(knapsack.findTargetSumWays(new int[]{1, 2}, Integer.MIN_VALUE) == 0, "negative target range guard");
        check(sequences.longestCommonSubsequence("abcde", "ace") == 3, "known LCS");
        check(sequences.numDistinctExact("rabbbit", "rabbit").equals(BigInteger.valueOf(3)), "known distinct subsequences");
        check(sequences.numDistinctExact("a", "aa").signum() == 0, "one source position cannot be reused");
        check(sequences.numDistinctExact("", "").equals(BigInteger.ONE), "one empty subsequence");
        check(sequences.numDistinctExact("a".repeat(100) + "b", "a".repeat(50) + "c").signum() == 0,
            "large intermediate counts with zero final answer");
        BigInteger binomial = BigInteger.ONE;
        for (int count = 1; count <= 50; count++) {
            binomial = binomial.multiply(BigInteger.valueOf(100 - count + 1)).divide(BigInteger.valueOf(count));
        }
        check(sequences.numDistinctExact("a".repeat(100), "a".repeat(50)).equals(binomial), "exact count above long range");
        for (int mask = 1; mask < 32; mask++) {
            List<Integer> selected = new ArrayList<>();
            for (int coin = 1; coin <= 5; coin++) if ((mask & (1 << (coin - 1))) != 0) selected.add(coin);
            int[] coins = selected.stream().mapToInt(Integer::intValue).toArray();
            for (int amount = 0; amount <= 8; amount++) {
                check(knapsack.completeKnapsackCountCombinations(coins, amount) == bruteCoinCombinations(coins, 0, amount), "coin combinations versus count enumeration");
                check(knapsack.completeKnapsackCountPermutations(coins, amount) == bruteCoinPermutations(coins, amount), "coin permutations versus sequence enumeration");
                check(knapsack.completeKnapsackMinCoins(coins, amount) == minimumCoinsBfs(coins, amount), "minimum coins versus BFS");
            }
        }
        for (int trial = 0; trial < 400; trial++) {
            int[] numbers = new int[random.nextInt(9)];
            for (int position = 0; position < numbers.length; position++) numbers[position] = random.nextInt(5);
            int target = random.nextInt(41) - 20;
            check(knapsack.findTargetSumWays(numbers, target) == bruteSigns(numbers, 0, 0, target), "target sum versus all sign assignments");
            StringBuilder first = new StringBuilder(), second = new StringBuilder();
            int firstLength = random.nextInt(9), secondLength = random.nextInt(7);
            for (int position = 0; position < firstLength; position++) first.append((char) ('a' + random.nextInt(3)));
            for (int position = 0; position < secondLength; position++) second.append((char) ('a' + random.nextInt(3)));
            int longest = 0, ways = 0;
            for (int mask = 0; mask < (1 << first.length()); mask++) {
                StringBuilder candidate = new StringBuilder();
                for (int position = 0; position < first.length(); position++) if ((mask & (1 << position)) != 0) candidate.append(first.charAt(position));
                if (isSubsequence(candidate.toString(), second.toString())) longest = Math.max(longest, candidate.length());
                if (candidate.toString().equals(second.toString())) ways++;
            }
            check(sequences.longestCommonSubsequence(first.toString(), second.toString()) == longest, "LCS versus all subsequences");
            check(sequences.numDistinctExact(first.toString(), second.toString()).equals(BigInteger.valueOf(ways)), "subsequence counts versus position masks");
        }
        MaximumTreePathExample paths = new MaximumTreePathExample();
        TreeRobExample robber = new TreeRobExample();
        TreeNode example = new TreeNode(-10);
        example.left = new TreeNode(9); example.right = new TreeNode(20);
        example.right.left = new TreeNode(15); example.right.right = new TreeNode(7);
        check(paths.maxPathSum(example) == 42, "tree optimum excludes root");
        check(paths.maxPathSum(new TreeNode(-3)) == -3, "nonempty negative tree and repeated calls");
        TreeNode branching = new TreeNode(1);
        branching.left = new TreeNode(2);
        branching.left.left = new TreeNode(3); branching.left.right = new TreeNode(4);
        check(paths.maxPathSum(branching) == 9, "three branches do not form one path");
        invalid(() -> paths.maxPathSum(null));
        for (int trial = 0; trial < 240; trial++) {
            List<TreeNode> nodes = new ArrayList<>();
            List<TreeNode> available = new ArrayList<>();
            TreeNode root = new TreeNode(random.nextInt(21) - 10);
            nodes.add(root); available.add(root);
            int size = 1 + random.nextInt(8);
            for (int position = 1; position < size; position++) {
                TreeNode node = new TreeNode(random.nextInt(21) - 10);
                TreeNode parent = available.get(random.nextInt(available.size()));
                if (parent.left == null) parent.left = node;
                else parent.right = node;
                if (parent.left != null && parent.right != null) available.remove(parent);
                nodes.add(node); available.add(node);
            }
            check(paths.maxPathSum(root) == bruteTreePath(nodes), "tree path versus all endpoint pairs");
            for (TreeNode node : nodes) node.val = Math.abs(node.val);
            check(robber.rob(root) == bruteTreeRob(nodes), "tree robber versus all independent node subsets");
        }
    }

    private static void probabilities() {
        ForwardKnight forward=new ForwardKnight();
        KnightSurvival backward=new KnightSurvival();
        for (int size=1; size<=5; size++) for (int steps=0; steps<=5; steps++) {
            for (int row=0; row<size; row++) for (int column=0; column<size; column++) {
                double first=forward.knightProbability(size,steps,row,column);
                double second=backward.knightProbabilityBackward(size,steps,row,column);
                check(Math.abs(first-second)<1e-12 && first>=0 && first<=1,"forward/backward probability");
            }
        }
        check(Math.abs(backward.knightProbabilityBackward(3,2,0,0)-0.0625)<1e-12,"known knight probability");
    }

    private static void graphs() {
        GraphExamples algorithms=new GraphExamples();
        for (int trial=0; trial<120; trial++) {
            int size=1+random.nextInt(7);
            List<List<int[]>> graph=new ArrayList<>();
            long[][] expected=new long[size][size];
            long infinity=1000000000000L;
            for (int vertex=0; vertex<size; vertex++) {
                graph.add(new ArrayList<>()); Arrays.fill(expected[vertex],infinity); expected[vertex][vertex]=0;
            }
            for (int vertex=0; vertex<size; vertex++) for (int next=0; next<size; next++) {
                if (random.nextInt(3)==0) {
                    int weight=random.nextInt(2); graph.get(vertex).add(new int[]{next,weight});
                    expected[vertex][next]=Math.min(expected[vertex][next],weight);
                }
            }
            for (int middle=0; middle<size; middle++) for (int start=0; start<size; start++) for (int end=0; end<size; end++) {
                expected[start][end]=Math.min(expected[start][end],expected[start][middle]+expected[middle][end]);
            }
            for (int source=0; source<size; source++) {
                int[] parent=new int[size];
                long[] distance=algorithms.dijkstra(graph,source,parent);
                int[] dequeDistance=algorithms.zeroOneBfs(graph,source);
                for (int target=0; target<size; target++) {
                    long answer=expected[source][target];
                    check(distance[target]==(answer==infinity ? Long.MAX_VALUE : answer),"Dijkstra versus Floyd");
                    check(dequeDistance[target]==(answer==infinity ? Integer.MAX_VALUE : answer),"0-1 BFS versus Floyd");
                    List<Integer> route=algorithms.restorePath(parent,distance,target);
                    if (answer==infinity) {check(route.isEmpty(),"unreachable route");continue;}
                    check(!route.isEmpty() && route.get(0)==source && route.get(route.size()-1)==target && route.size()<=size,"route endpoints");
                    long cost=0;
                    for (int index=1; index<route.size(); index++) {
                        int cheapest=Integer.MAX_VALUE;
                        for (int[] edge:graph.get(route.get(index-1))) if (edge[0]==route.get(index)) cheapest=Math.min(cheapest,edge[1]);
                        check(cheapest!=Integer.MAX_VALUE,"route uses existing edge"); cost+=cheapest;
                    }
                    check(cost==answer,"route cost");
                }
            }
        }
        List<List<int[]>> large=new ArrayList<>();
        large.add(List.of(new int[]{1,2000000000})); large.add(List.of(new int[]{2,2000000000})); large.add(List.of());
        check(algorithms.dijkstra(large,0,3)[2]==4000000000L,"long shortest distance");
        for (int mask=0; mask<512; mask++) {
            List<List<Integer>> graph=new ArrayList<>();
            boolean[][] reachable=new boolean[3][3];
            for (int vertex=0; vertex<3; vertex++) {
                graph.add(new ArrayList<>()); reachable[vertex][vertex]=true;
                for (int next=0; next<3; next++) if ((mask & (1 << (vertex*3+next)))!=0) {
                    graph.get(vertex).add(next); reachable[vertex][next]=true;
                }
            }
            for (int middle=0; middle<3; middle++) for (int start=0; start<3; start++) for (int end=0; end<3; end++) {
                reachable[start][end] |= reachable[start][middle] && reachable[middle][end];
            }
            int[] componentIds={-1,-1,-1};
            int componentId=0;
            for (List<Integer> component:new Tarjan(3,graph).findSCCs()) {
                for (int vertex:component) {check(componentIds[vertex]==-1,"SCC duplicate vertex");componentIds[vertex]=componentId;}
                componentId++;
            }
            boolean cycle=false;
            for (int start=0; start<3; start++) {
                check(componentIds[start]>=0,"SCC missing vertex");
                for (int end=0; end<3; end++) check((componentIds[start]==componentIds[end])==(reachable[start][end] && reachable[end][start]),"SCC versus reachability");
                for (int next:graph.get(start)) if (reachable[next][start]) cycle=true;
            }
            check(new CycleExample().hasDirectedCycle(graph)==cycle,"cycles including self loops");
        }
    }

    private static class SlowLfu {
        private static class Entry {
            int value, frequency=1;
            long accessed;
            Entry(int value,long accessed) {this.value=value;this.accessed=accessed;}
        }
        final int capacity;
        final Map<Integer,Entry> entries=new HashMap<>();
        long clock;
        SlowLfu(int capacity) {this.capacity=capacity;}
        int get(int key) {
            clock++; Entry entry=entries.get(key);
            if (entry==null) return -1;
            entry.frequency++;entry.accessed=clock;return entry.value;
        }
        void put(int key,int value) {
            clock++;
            if (capacity==0) return;
            Entry entry=entries.get(key);
            if (entry!=null) {entry.value=value;entry.frequency++;entry.accessed=clock;return;}
            if (entries.size()==capacity) {
                int victim=-1; Entry oldest=null;
                for (Map.Entry<Integer,Entry> candidate:entries.entrySet()) {
                    Entry current=candidate.getValue();
                    if (oldest==null || current.frequency<oldest.frequency
                            || current.frequency==oldest.frequency && current.accessed<oldest.accessed) {
                        victim=candidate.getKey();oldest=current;
                    }
                }
                entries.remove(victim);
            }
            entries.put(key,new Entry(value,clock));
        }
    }

    private static void caches() throws Exception {
        Field buckets=LFUCache.class.getDeclaredField("freqToList");buckets.setAccessible(true);
        for (int capacity=0; capacity<=4; capacity++) {
            LFUCache actual=new LFUCache(capacity);SlowLfu expected=new SlowLfu(capacity);
            for (int operation=0; operation<800; operation++) {
                int key=random.nextInt(7);
                if (random.nextBoolean()) check(actual.get(key)==expected.get(key),"LFU result");
                else {int value=random.nextInt(100);actual.put(key,value);expected.put(key,value);}
                Map<?,?> stored=(Map<?,?>)buckets.get(actual);
                check(stored.size()<=expected.entries.size(),"LFU bucket bound");
                for (Object bucket:stored.values()) {
                    Field size=bucket.getClass().getDeclaredField("size");size.setAccessible(true);
                    check(size.getInt(bucket)>0,"LFU empty bucket");
                }
            }
        }
        LFUCache singleton=new LFUCache(1);singleton.put(1,10);
        for (int access=0; access<10000; access++) check(singleton.get(1)==10,"LFU hot key");
        check(((Map<?,?>)buckets.get(singleton)).size()==1,"LFU historical bucket leak");
        invalid(()->new LFUCache(-1));
    }

    private static void limiters() {
        AtomicLong clock=new AtomicLong();
        SlidingWindowCounter counter=new SlidingWindowCounter(1000,2,10,clock::get);
        SlidingWindowLog log=new SlidingWindowLog(1000,2,clock::get);
        long[] times={1000,1099,2000,2001};
        boolean[] counterAnswers={true,true,false,false},logAnswers={true,true,true,false};
        for (int index=0; index<times.length; index++) {
            clock.set(times[index]*1000000);
            check(counter.tryAcquire()==counterAnswers[index],"counter boundary regression");
            check(log.tryAcquire()==logAnswers[index],"log boundary regression");
        }
        clock.set(0);counter=new SlidingWindowCounter(1000,5,10,clock::get);log=new SlidingWindowLog(1000,5,clock::get);
        List<Long> exactHistory=new ArrayList<>(),bucketHistory=new ArrayList<>();
        for (int request=0; request<3000; request++) {
            long now=clock.addAndGet(random.nextInt(100000001));
            exactHistory.removeIf(time->now-time>=1000000000L);
            boolean exactExpected=exactHistory.size()<5;
            check(log.tryAcquire()==exactExpected,"exact log versus history");
            if (exactExpected) exactHistory.add(now);
            long cutoff=(now/100000000L-10)*100000000L;
            bucketHistory.removeIf(time->time<cutoff);
            boolean conservativeExpected=bucketHistory.size()<5;
            boolean conservative=counter.tryAcquire();
            check(conservative==conservativeExpected,"conservative counter versus history");
            if (conservative) bucketHistory.add(now);
            check(bucketHistory.stream().filter(time->now-time<1000000000L).count()<=5,"no rolling-window over-admission");
        }
        clock.addAndGet(10000000000L);
        check(counter.tryAcquire() && log.tryAcquire(),"idle window expiry");
        clock.set(0);TokenBucket tokens=new TokenBucket(2,2,clock::get);
        check(tokens.tryAcquire(2) && !tokens.tryAcquire(1),"token burst capacity");
        clock.set(499999999);check(!tokens.tryAcquire(1),"fractional token");
        clock.set(500000000);check(tokens.tryAcquire(1),"refill boundary");
        clock.set(10000000000L);check(tokens.tryAcquire(2) && !tokens.tryAcquire(1),"refill capped");
        invalid(()->tokens.tryAcquire(-1));invalid(()->new TokenBucket(2,Double.NaN));
        clock.set(0);LeakyBucketShaper shaper=new LeakyBucketShaper(2,100000000,clock::get);
        Runnable first=()->{},second=()->{};
        check(shaper.tryEnqueue(first) && shaper.tryEnqueue(second) && !shaper.tryEnqueue(first),"shaper queue capacity");
        check(shaper.pollReady()==first && shaper.pollReady()==null,"shaper first release");
        clock.set(99999999);check(shaper.pollReady()==null,"shaper before deadline");
        clock.set(100000000);check(shaper.pollReady()==second && shaper.pollReady()==null,"shaper FIFO and spacing");
        invalid(()->new SlidingWindowCounter(1000,2,7));invalid(()->new SlidingWindowLog(0,1));
    }

    public static void main(String[] args) throws Exception {
        arrays();dynamicProgramming();probabilities();graphs();caches();limiters();
        System.out.println("PASS: "+checks+" Java assertions; arrays, DP, probabilities, shortest paths, SCC, LFU and rate limiters.");
    }
}
`;

const temporary = mkdtempSync(join(tmpdir(), 'dev-guide-algorithms-'));
try {
  const sourceFile = join(temporary, 'AlgorithmExamplesCheck.java');
  writeFileSync(sourceFile, [
    'import java.util.*;', 'import java.util.function.LongSupplier;',
    'import java.util.concurrent.atomic.AtomicLong;', 'import java.lang.reflect.Field;',
    'import java.math.BigInteger;', ...sources, harness,
  ].join('\n'));
    execFileSync(executable('javac'), ['-encoding', 'UTF-8', '-d', temporary, sourceFile], { stdio: 'inherit', timeout: 120_000 });
    execFileSync(executable('java'), ['-cp', temporary, 'AlgorithmExamplesCheck'], { stdio: 'inherit', timeout: 120_000 });
  console.log(`Checked ${extracted} Java fences extracted from ${cache.size} Markdown files.`);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('JDK required: set JAVA_HOME, add javac/java to PATH, or pass --java-home <JDK directory>.');
  }
  process.exitCode = 1;
  console.error(error.message);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}