import { prisma } from './prisma';

let hasBootstrapped = false;

/**
 * Idempotent, safe production bootstrap function.
 * Called dynamically when required static records are missing or partially complete.
 * Relies on PostgreSQL-level idempotency (unique ID constraints & upserts) so that 
 * concurrent Vercel serverless requests execute safely without duplicating records.
 */
export async function ensureStaticData() {
  // Fast path for memory persistence in same container
  if (hasBootstrapped) return;

  try {
    const EXPECTED_QUESTIONS = 15;
    const questionsCount = await prisma.interviewQuestion.count();
    
    // Recover from partial state: if count < expected, we forcefully upsert missing records.
    if (questionsCount < EXPECTED_QUESTIONS) {
      console.log('🌱 Checking / Seeding interview questions...');
      const questions = [
        // DSA
        {
          topic: 'DSA', subTopic: 'Arrays', difficulty: 'easy', format: 'mcq',
          question: 'What is the time complexity of accessing an element in an array by index?',
          options: JSON.stringify(['O(n)', 'O(log n)', 'O(1)', 'O(n²)']),
          answer: 'O(1)',
          explanation: 'Arrays store elements in contiguous memory, so index-based access is always constant time O(1).',
          tags: 'arrays,complexity',
        },
        {
          topic: 'DSA', subTopic: 'Sorting', difficulty: 'medium', format: 'mcq',
          question: 'Which sorting algorithm is stable and has O(n log n) average time complexity?',
          options: JSON.stringify(['Quick Sort', 'Heap Sort', 'Merge Sort', 'Selection Sort']),
          answer: 'Merge Sort',
          explanation: 'Merge Sort is a stable, divide-and-conquer algorithm with guaranteed O(n log n) time in all cases.',
          tags: 'sorting,merge-sort',
        },
        {
          topic: 'DSA', subTopic: 'Trees', difficulty: 'medium', format: 'mcq',
          question: 'In a Binary Search Tree, which traversal visits nodes in sorted order?',
          options: JSON.stringify(['Pre-order', 'Post-order', 'In-order', 'Level-order']),
          answer: 'In-order',
          explanation: 'In-order traversal (Left → Root → Right) visits BST nodes in ascending sorted order.',
          tags: 'bst,traversal',
        },
        // OOP
        {
          topic: 'OOP', subTopic: 'Principles', difficulty: 'easy', format: 'true_false',
          question: 'Encapsulation means bundling data and the methods that operate on that data into a single unit.',
          options: JSON.stringify(['True', 'False']),
          answer: 'True',
          explanation: 'Encapsulation is one of the four core OOP principles. It hides internal state and only exposes a public interface.',
          tags: 'encapsulation,principles',
        },
        {
          topic: 'OOP', subTopic: 'Polymorphism', difficulty: 'medium', format: 'mcq',
          question: 'Which type of polymorphism is resolved at compile time?',
          options: JSON.stringify(['Runtime polymorphism', 'Compile-time polymorphism', 'Dynamic dispatch', 'Duck typing']),
          answer: 'Compile-time polymorphism',
          explanation: 'Method overloading is resolved at compile time (static binding). Method overriding uses dynamic dispatch at runtime.',
          tags: 'polymorphism,overloading',
        },
        // DBMS
        {
          topic: 'DBMS', subTopic: 'SQL', difficulty: 'easy', format: 'mcq',
          question: 'Which SQL clause is used to filter rows after grouping?',
          options: JSON.stringify(['WHERE', 'HAVING', 'FILTER', 'GROUP BY']),
          answer: 'HAVING',
          explanation: 'HAVING filters groups after GROUP BY. WHERE filters rows before grouping.',
          tags: 'sql,having,group-by',
        },
        {
          topic: 'DBMS', subTopic: 'Normalization', difficulty: 'medium', format: 'mcq',
          question: 'A table is in 2NF if it is in 1NF and every non-key attribute is:',
          options: JSON.stringify([
            'Partially dependent on the primary key',
            'Fully functionally dependent on the entire primary key',
            'Transitively dependent on a non-key attribute',
            'Dependent on a candidate key only',
          ]),
          answer: 'Fully functionally dependent on the entire primary key',
          explanation: '2NF eliminates partial dependencies — every non-prime attribute must depend on the whole composite key.',
          tags: 'normalization,2nf',
        },
        // Operating Systems
        {
          topic: 'OS', subTopic: 'Scheduling', difficulty: 'medium', format: 'mcq',
          question: 'Which CPU scheduling algorithm can lead to starvation?',
          options: JSON.stringify(['Round Robin', 'FCFS', 'Priority Scheduling', 'SRTF']),
          answer: 'Priority Scheduling',
          explanation: 'In Priority Scheduling, low-priority processes may wait indefinitely if higher-priority processes keep arriving — this is called starvation.',
          tags: 'scheduling,starvation',
        },
        // Computer Networks
        {
          topic: 'CN', subTopic: 'OSI Model', difficulty: 'easy', format: 'mcq',
          question: 'Which layer of the OSI model handles routing of packets between networks?',
          options: JSON.stringify(['Layer 2 — Data Link', 'Layer 3 — Network', 'Layer 4 — Transport', 'Layer 5 — Session']),
          answer: 'Layer 3 — Network',
          explanation: 'The Network layer (Layer 3) is responsible for logical addressing and routing. IP operates at this layer.',
          tags: 'osi,routing,network-layer',
        },
        // JavaScript
        {
          topic: 'JavaScript', subTopic: 'Async', difficulty: 'medium', format: 'mcq',
          question: 'What does the "Event Loop" do in JavaScript?',
          options: JSON.stringify([
            'Executes code in parallel threads',
            'Monitors the call stack and moves callbacks from the task queue when the stack is empty',
            'Manages memory allocation',
            'Handles CSS animations',
          ]),
          answer: 'Monitors the call stack and moves callbacks from the task queue when the stack is empty',
          explanation: 'JavaScript is single-threaded. The Event Loop processes the callback/task queue when the call stack is empty, enabling async behavior.',
          tags: 'event-loop,async,javascript',
        },
        // Backend
        {
          topic: 'Backend', subTopic: 'REST', difficulty: 'easy', format: 'mcq',
          question: 'Which HTTP status code indicates a resource was successfully created?',
          options: JSON.stringify(['200 OK', '201 Created', '204 No Content', '301 Moved Permanently']),
          answer: '201 Created',
          explanation: '201 Created is the correct response for a successful POST that creates a new resource.',
          tags: 'http,rest,status-codes',
        },
        // SQL
        {
          topic: 'SQL', subTopic: 'Joins', difficulty: 'medium', format: 'mcq',
          question: 'Which JOIN returns all rows from both tables, filling NULLs where there is no match?',
          options: JSON.stringify(['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN']),
          answer: 'FULL OUTER JOIN',
          explanation: 'FULL OUTER JOIN combines LEFT and RIGHT joins — returns all rows from both tables, with NULLs where there is no match on either side.',
          tags: 'joins,full-outer-join',
        },
        // Aptitude
        {
          topic: 'Aptitude', subTopic: 'Percentages', difficulty: 'easy', format: 'short_answer',
          question: 'A product costs ₹800. After a 25% discount, what is the final price?',
          options: JSON.stringify([]),
          answer: '₹600',
          explanation: '25% of ₹800 = ₹200. Final price = ₹800 - ₹200 = ₹600.',
          tags: 'percentages,discount',
        },
        {
          topic: 'Aptitude', subTopic: 'Time/Work', difficulty: 'medium', format: 'mcq',
          question: 'A can complete a job in 12 days. B can complete it in 15 days. Working together, how many days will they take?',
          options: JSON.stringify(['6 days', '6.67 days', '7 days', '5.5 days']),
          answer: '6.67 days',
          explanation: 'Combined rate = 1/12 + 1/15 = 5/60 + 4/60 = 9/60 = 3/20. Days = 20/3 ≈ 6.67 days.',
          tags: 'time-work,combined-work',
        },
        // Logical Reasoning
        {
          topic: 'Logical Reasoning', subTopic: 'Sequences', difficulty: 'medium', format: 'mcq',
          question: 'What is the next number in the sequence: 2, 6, 12, 20, 30, ?',
          options: JSON.stringify(['36', '40', '42', '44']),
          answer: '42',
          explanation: 'Differences: 4, 6, 8, 10, 12. Next number = 30 + 12 = 42. The differences increase by 2 each time.',
          tags: 'sequences,pattern',
        },
      ];

      // Concurrent PG unique id upserts handle global locks natively
      for (const q of questions) {
        await prisma.interviewQuestion.upsert({
          where:  { id: `q_${q.topic}_${q.subTopic}_${q.question.slice(0, 20).replace(/\s/g, '_')}` },
          update: {},
          create: { id: `q_${q.topic}_${q.subTopic}_${q.question.slice(0, 20).replace(/\s/g, '_')}`, ...q },
        });
      }
    }

    const EXPECTED_PROJECTS = 2;
    const projectsCount = await prisma.project.count();

    if (projectsCount < EXPECTED_PROJECTS) {
      console.log('🌱 Checking / Seeding projects...');
      await prisma.project.upsert({
        where:  { id: 'proj_url_shortener' },
        update: {},
        create: {
          id:          'proj_url_shortener',
          name:        'URL Shortener',
          description: 'Build a production-grade URL shortener from scratch, adding features incrementally.',
          difficulty:  'intermediate',
          durationEst: '2–3 weeks',
          stack:       'Node.js,Express,PostgreSQL,Redis,Docker',
          categories:  'Backend,APIs,DevOps',
          whatYouLearn: 'REST API design, database indexing, caching with Redis, rate limiting, Docker deployment.',
          prerequisites: 'Basic JavaScript, HTTP fundamentals',
          resources:   JSON.stringify([
            { title: 'roadmap.sh — Backend Roadmap', url: 'https://roadmap.sh/backend' },
          ]),
          stages: {
            create: [
              { sequence: 1, title: 'Basic API',      description: 'Create POST /shorten and GET /:code endpoints with in-memory storage.' },
              { sequence: 2, title: 'Database',       description: 'Replace in-memory storage with PostgreSQL. Add URL model and migrations.' },
              { sequence: 3, title: 'Authentication', description: 'Add user accounts. Require auth for creating short links.' },
              { sequence: 4, title: 'Analytics',      description: 'Track click count, referrer, and timestamp per short URL.' },
              { sequence: 5, title: 'Redis Cache',    description: 'Cache redirect lookups in Redis to reduce DB hits.' },
              { sequence: 6, title: 'Rate Limiting',  description: 'Add per-user and per-IP rate limiting.' },
              { sequence: 7, title: 'Deployment',     description: 'Dockerize the application and deploy with a reverse proxy.' },
            ],
          },
        },
      });

      await prisma.project.upsert({
        where:  { id: 'proj_booking_system' },
        update: {},
        create: {
          id:          'proj_booking_system',
          name:        'Booking System',
          description: 'Build a slot-based booking system with concurrency handling and notifications.',
          difficulty:  'advanced',
          durationEst: '3–5 weeks',
          stack:       'Node.js,PostgreSQL,WebSockets,Redis,JWT',
          categories:  'Backend,FullStack,APIs',
          whatYouLearn: 'Concurrency control, transactions, real-time updates, JWT auth, email notifications.',
          prerequisites: 'REST APIs, SQL, basic auth',
          resources:   JSON.stringify([]),
          stages: {
            create: [
              { sequence: 1, title: 'Slot Model',     description: 'Design the data model for resources, slots, and bookings.' },
              { sequence: 2, title: 'CRUD API',        description: 'Build create/read/update/delete endpoints for bookings.' },
              { sequence: 3, title: 'Concurrency',    description: 'Prevent double-bookings using DB transactions and row locks.' },
              { sequence: 4, title: 'Auth',            description: 'Add JWT-based authentication and authorization.' },
              { sequence: 5, title: 'Real-time',       description: 'Add WebSocket notifications for booking confirmations.' },
              { sequence: 6, title: 'Testing',         description: 'Write integration tests for concurrency edge cases.' },
            ],
          },
        },
      });
    }

    if (questionsCount === EXPECTED_QUESTIONS && projectsCount === EXPECTED_PROJECTS) {
       hasBootstrapped = true;
    }
  } catch (err) {
    console.error('Error during static data bootstrap', err);
    // Suppress so the rest of the application can try failing gracefully or recovering on reload
  }
}
