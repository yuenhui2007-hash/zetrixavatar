#!/usr/bin/env python3
"""
Update all course HTML files to include varied assessment types.
Replaces some MCQ-only segments with matching, sequencing, fill-blanks, true/false, scenario.
"""
import re
import json

# Assessment templates for each course
course_assessments = {
    'ai-brain': {
        0: {  # PKM Deep Dive -> Matching
            'type': 'matching',
            'pairs': [
                {'left': 'Capture Layer', 'right': 'Raw inputs like notes and clippings'},
                {'left': 'Process Layer', 'right': 'Distilled notes with insights'},
                {'left': 'Retrieve Layer', 'right': 'Structured folders and linked docs'},
                {'left': 'Create Layer', 'right': 'Reports, emails, presentations'}
            ]
        },
        2: {  # Memory Architecture -> Fill in the blanks
            'type': 'fillblank',
            'instruction': 'Fill in the missing words to complete the sentences about memory architecture.',
            'text': 'Short-term memory holds about {blank} items for {blank} seconds. The hippocampus converts short-term to {blank} memory during sleep. Emotional tagging strengthens memory via the {blank}.',
            'answers': [['7', 'seven'], ['30', 'thirty'], ['long-term', 'long term'], ['amygdala']]
        },
        4: {  # Attention Management -> True/False
            'type': 'truefalse',
            'statements': [
                {'text': 'Multitasking increases productivity by allowing parallel processing.', 'correct': False},
                {'text': 'The Pomodoro technique uses 25-minute focused work blocks.', 'correct': True},
                {'text': 'Context switching has no cognitive cost.', 'correct': False},
                {'text': 'Deep work requires uninterrupted focus for extended periods.', 'correct': True}
            ],
            'passThreshold': 75
        },
        6: {  # Creative Problem Solving -> Scenario
            'type': 'scenario',
            'scenario': 'You are a product manager facing declining user engagement. Your team has three ideas: (A) Add more features, (B) Simplify the interface, (C) Increase marketing spend.',
            'question': 'Using the Zetrix creative problem-solving framework, which approach should you prioritize first?',
            'options': ['Add more features immediately', 'Simplify the interface based on user feedback', 'Increase marketing spend to attract new users', 'Conduct A/B testing on all three approaches'],
            'correct': 1,
            'explanation': 'Simplification addresses the root cause (poor UX) rather than symptoms. The Zetrix framework emphasizes understanding before acting.'
        },
        8: {  # Knowledge Synthesis -> Sequencing
            'type': 'sequencing',
            'instruction': 'Drag the steps into the correct order for synthesizing knowledge.',
            'items': [
                'Gather diverse sources on the topic',
                'Identify patterns and contradictions',
                'Formulate a unified thesis',
                'Test thesis against edge cases',
                'Document the synthesis with citations'
            ],
            'correctOrder': [0, 1, 2, 3, 4]
        }
    },
    'avatar-foundations': {
        1: {  # Core Concepts -> Matching
            'type': 'matching',
            'pairs': [
                {'left': 'Avatar', 'right': 'Your AI representation and knowledge interface'},
                {'left': 'PKM', 'right': 'Personal Knowledge Management system'},
                {'left': 'Context Window', 'right': 'The working memory of the AI'},
                {'left': 'Embedding', 'right': 'Vector representation of knowledge'}
            ]
        },
        3: {  # Setting Up -> True/False
            'type': 'truefalse',
            'statements': [
                {'text': 'You should upload all documents at once for maximum efficiency.', 'correct': False},
                {'text': 'Organizing documents by topic improves retrieval accuracy.', 'correct': True},
                {'text': 'The Avatar can process unlimited documents simultaneously.', 'correct': False},
                {'text': 'Metadata tags help the Avatar understand document context.', 'correct': True}
            ],
            'passThreshold': 75
        },
        5: {  # Daily Workflow -> Sequencing
            'type': 'sequencing',
            'instruction': 'Arrange the daily workflow steps in the correct order.',
            'items': [
                'Morning: Review overnight captures',
                'Mid-morning: Process and tag new inputs',
                'Afternoon: Deep work with Avatar assistance',
                'Evening: Review completions and plan tomorrow'
            ],
            'correctOrder': [0, 1, 2, 3]
        },
        7: {  # Advanced Tips -> Fill in the blanks
            'type': 'fillblank',
            'instruction': 'Complete the advanced tips with the correct terms.',
            'text': 'Use {blank} prompts to get more specific answers. The {blank} method helps break complex tasks into smaller steps. Always {blank} your Avatar\'s outputs before using them in production.',
            'answers': [['structured'], ['chain-of-thought', 'chain of thought'], ['verify', 'validate', 'check']]
        },
        9: {  # Troubleshooting -> Scenario
            'type': 'scenario',
            'scenario': 'Your Avatar is giving irrelevant answers when you ask about your project documentation. You have 50 documents uploaded but the responses seem generic.',
            'question': 'What is the most likely cause and best first step to fix it?',
            'options': ['The Avatar is broken - contact support', 'Documents lack proper metadata and tags', 'You need to upload more documents', 'The context window is too small'],
            'correct': 1,
            'explanation': 'Without proper metadata and tags, the Avatar cannot distinguish between documents. Adding descriptive metadata is the fastest fix.'
        }
    },
    'ai-coding': {
        1: {  # Python Basics -> Matching
            'type': 'matching',
            'pairs': [
                {'left': 'List', 'right': 'Ordered, mutable collection'},
                {'left': 'Dictionary', 'right': 'Key-value pairs mapping'},
                {'left': 'Tuple', 'right': 'Ordered, immutable collection'},
                {'left': 'Set', 'right': 'Unordered unique elements'}
            ]
        },
        3: {  # Functions & Modules -> Fill in the blanks
            'type': 'fillblank',
            'instruction': 'Complete the Python function concepts.',
            'text': 'A function in Python is defined using the {blank} keyword. The {blank} statement returns a value. {blank} arguments have default values.',
            'answers': [['def'], ['return'], ['Keyword', 'keyword']]
        },
        5: {  # Error Handling -> True/False
            'type': 'truefalse',
            'statements': [
                {'text': 'try/except blocks should catch all exceptions broadly.', 'correct': False},
                {'text': 'finally blocks always execute regardless of exceptions.', 'correct': True},
                {'text': 'raise is used to create custom exceptions.', 'correct': True},
                {'text': 'Silent failures are preferred over explicit error messages.', 'correct': False}
            ],
            'passThreshold': 75
        },
        7: {  # API Integration -> Scenario
            'type': 'scenario',
            'scenario': 'You need to fetch data from a REST API that returns JSON. The API has a rate limit of 100 requests per minute and requires an API key in the header.',
            'question': 'Which approach follows best practices?',
            'options': ['Make requests as fast as possible', 'Include API key in URL parameters', 'Use requests library with headers and implement retry logic', 'Hardcode the API key in your source code'],
            'correct': 2,
            'explanation': 'Using headers for API keys is more secure, and retry logic with rate limiting respects the API provider.'
        }
    },
    'sales-marketing': {
        1: {  # Sales Fundamentals -> Matching
            'type': 'matching',
            'pairs': [
                {'left': 'Prospecting', 'right': 'Identifying potential customers'},
                {'left': 'Qualifying', 'right': 'Determining if a lead is worth pursuing'},
                {'left': 'Closing', 'right': 'Securing the commitment'},
                {'left': 'Nurturing', 'right': 'Building long-term relationships'}
            ]
        },
        3: {  # Marketing Channels -> Sequencing
            'type': 'sequencing',
            'instruction': 'Order the marketing funnel stages correctly.',
            'items': [
                'Awareness - Customer learns about your product',
                'Interest - Customer explores features and benefits',
                'Consideration - Customer compares with alternatives',
                'Conversion - Customer makes a purchase',
                'Retention - Customer becomes a repeat buyer'
            ],
            'correctOrder': [0, 1, 2, 3, 4]
        },
        5: {  # CRM Usage -> Fill in the blanks
            'type': 'fillblank',
            'instruction': 'Complete the CRM best practices.',
            'text': 'Always {blank} contact information after each interaction. Use {blank} to track where leads come from. Set {blank} to follow up with prospects promptly.',
            'answers': [['update'], ['tags', 'source tags'], ['reminders', 'alerts', 'notifications']]
        },
        7: {  # Analytics -> True/False
            'type': 'truefalse',
            'statements': [
                {'text': 'Conversion rate measures the percentage of visitors who take a desired action.', 'correct': True},
                {'text': 'Bounce rate is always a negative metric.', 'correct': False},
                {'text': 'A/B testing requires large sample sizes for statistical significance.', 'correct': True},
                {'text': ' vanity metrics like total page views should be the primary KPI.', 'correct': False}
            ],
            'passThreshold': 75
        },
        9: {  # Campaign Planning -> Scenario
            'type': 'scenario',
            'scenario': 'You are launching a new product. Your budget is $10,000. Option A: Run Facebook ads targeting a broad audience. Option B: Partner with 5 micro-influencers in your niche. Option C: Sponsor a podcast your target audience listens to.',
            'question': 'Which strategy offers the best ROI for a niche B2B product?',
            'options': ['Facebook ads with broad targeting', 'Micro-influencer partnerships', 'Podcast sponsorship', 'Split budget equally across all three'],
            'correct': 2,
            'explanation': 'Podcast sponsorship reaches a pre-qualified, engaged audience. For B2B niche products, targeted reach beats broad exposure.'
        }
    },
    'personal-productivity': {
        1: {  # Time Management -> Matching
            'type': 'matching',
            'pairs': [
                {'left': 'Eisenhower Matrix', 'right': 'Urgent vs Important tasks'},
                {'left': 'Pomodoro', 'right': '25-minute focused intervals'},
                {'left': 'Time Blocking', 'right': 'Schedule tasks in calendar slots'},
                {'left': 'Two-Minute Rule', 'right': 'Do it now if under 2 minutes'}
            ]
        },
        3: {  # Email Management -> Sequencing
            'type': 'sequencing',
            'instruction': 'Order the email processing steps correctly.',
            'items': [
                'Scan subject lines and delete irrelevant emails',
                'Reply to emails requiring less than 2 minutes',
                'Move actionable emails to a todo folder',
                'Schedule time to handle complex responses',
                'Archive processed emails'
            ],
            'correctOrder': [0, 1, 2, 3, 4]
        },
        5: {  # Meeting Efficiency -> True/False
            'type': 'truefalse',
            'statements': [
                {'text': 'Every meeting needs a clear agenda shared in advance.', 'correct': True},
                {'text': 'The optimal meeting duration is always 60 minutes.', 'correct': False},
                {'text': 'Standing meetings tend to be shorter and more focused.', 'correct': True},
                {'text': 'Meeting notes should be sent within 24 hours.', 'correct': True}
            ],
            'passThreshold': 75
        },
        7: {  # Focus Techniques -> Fill in the blanks
            'type': 'fillblank',
            'instruction': 'Complete the focus technique descriptions.',
            'text': 'The {blank} technique involves working in 25-minute sprints with 5-minute breaks. {blank} work requires eliminating all distractions for deep concentration. The {blank} rule states if a task takes less than 2 minutes, do it immediately.',
            'answers': [['Pomodoro'], ['Deep'], ['two-minute', 'two minute', '2-minute', '2 minute']]
        }
    },
    'one-person-company': {
        1: {  # Business Structure -> Matching
            'type': 'matching',
            'pairs': [
                {'left': 'Sole Proprietorship', 'right': 'Simplest, unlimited liability'},
                {'left': 'LLC', 'right': 'Limited liability, flexible taxation'},
                {'left': 'S-Corp', 'right': 'Pass-through taxation, salary requirements'},
                {'left': 'C-Corp', 'right': 'Double taxation, easiest to raise capital'}
            ]
        },
        3: {  # Financial Basics -> Fill in the blanks
            'type': 'fillblank',
            'instruction': 'Complete the financial terms.',
            'text': 'Revenue minus expenses equals {blank}. Fixed costs remain {blank} regardless of sales volume. {blank} margin shows profitability per unit sold.',
            'answers': [['profit', 'net income'], ['constant', 'the same', 'unchanged'], ['Gross', 'gross profit']]
        },
        5: {  # Legal Essentials -> True/False
            'type': 'truefalse',
            'statements': [
                {'text': 'A handshake agreement is legally binding in most jurisdictions.', 'correct': True},
                {'text': 'You do not need contracts for small projects.', 'correct': False},
                {'text': 'Intellectual property rights transfer automatically when you hire a contractor.', 'correct': False},
                {'text': 'Keeping business and personal finances separate protects your liability shield.', 'correct': True}
            ],
            'passThreshold': 75
        },
        7: {  # Marketing for One -> Scenario
            'type': 'scenario',
            'scenario': 'You are a solo consultant with 20 hours/week for client work. You currently spend 10 hours/week on admin and marketing. Your pipeline is drying up.',
            'question': 'What is the best immediate action?',
            'options': ['Hire a full-time assistant', 'Raise prices to work fewer hours', 'Automate repetitive tasks and focus marketing on one channel', 'Take on any project to fill the gap'],
            'correct': 2,
            'explanation': 'Automation frees up time. Focusing on one marketing channel is more effective for a solo operator than scattered efforts.'
        }
    },
    'business-automation': {
        1: {  # Workflow Analysis -> Matching
            'type': 'matching',
            'pairs': [
                {'left': 'Bottleneck', 'right': 'Step that limits overall throughput'},
                {'left': 'Trigger', 'right': 'Event that starts a workflow'},
                {'left': 'Action', 'right': 'Task performed automatically'},
                {'left': 'Condition', 'right': 'Decision point in a workflow'}
            ]
        },
        3: {  # Zapier Basics -> Sequencing
            'type': 'sequencing',
            'instruction': 'Order the steps to create a Zap.',
            'items': [
                'Choose a trigger app and event',
                'Test the trigger to pull sample data',
                'Choose an action app and event',
                'Map fields from trigger to action',
                'Turn on the Zap and monitor'
            ],
            'correctOrder': [0, 1, 2, 3, 4]
        },
        5: {  # Email Automation -> True/False
            'type': 'truefalse',
            'statements': [
                {'text': 'Drip campaigns send emails based on user actions.', 'correct': True},
                {'text': 'All automated emails should be purely promotional.', 'correct': False},
                {'text': 'Segmentation improves email open rates.', 'correct': True},
                {'text': 'You should never personalize automated emails.', 'correct': False}
            ],
            'passThreshold': 75
        },
        7: {  # CRM Automation -> Fill in the blanks
            'type': 'fillblank',
            'instruction': 'Complete the CRM automation concepts.',
            'text': 'When a lead fills out a form, a {blank} can create a contact automatically. {blank} scoring ranks leads by engagement. A {blank} trigger sends follow-up emails based on behavior.',
            'answers': [['workflow', 'automation'], ['Lead', 'lead'], ['behavioral', 'behavior']]
        },
        9: {  # Advanced Workflows -> Scenario
            'type': 'scenario',
            'scenario': 'Your company receives 200 support tickets daily. 60% are password resets, 30% are billing questions, 10% are technical bugs. You have one support person.',
            'question': 'Which automation strategy helps most?',
            'options': ['Hire 3 more support staff', 'Build a self-service portal and auto-route tickets', 'Ignore password reset requests', 'Respond to all tickets manually but faster'],
            'correct': 1,
            'explanation': 'Self-service handles the 60% password resets automatically. Auto-routing ensures the right person handles each issue.'
        }
    },
    'solution-architecture': {
        1: {  # Architecture Patterns -> Matching
            'type': 'matching',
            'pairs': [
                {'left': 'Monolith', 'right': 'Single codebase, simple deployment'},
                {'left': 'Microservices', 'right': 'Independent deployable services'},
                {'left': 'Serverless', 'right': 'Event-driven, no server management'},
                {'left': 'Event-Driven', 'right': 'Components communicate via events'}
            ]
        },
        3: {  # Database Design -> Sequencing
            'type': 'sequencing',
            'instruction': 'Order the database normalization steps.',
            'items': [
                'First Normal Form: Eliminate repeating groups',
                'Second Normal Form: Remove partial dependencies',
                'Third Normal Form: Remove transitive dependencies',
                'Boyce-Codd Normal Form: Handle overlapping candidate keys',
                'Denormalize selectively for performance'
            ],
            'correctOrder': [0, 1, 2, 3, 4]
        },
        5: {  # API Design -> Fill in the blanks
            'type': 'fillblank',
            'instruction': 'Complete the API design principles.',
            'text': 'REST APIs use {blank} methods like GET, POST, PUT, DELETE. {blank} responses should include proper status codes. API {blank} controls how many requests a client can make.',
            'answers': [['HTTP'], ['Error', 'error'], ['rate limiting', 'throttling', 'rate limit']]
        },
        7: {  # Security -> True/False
            'type': 'truefalse',
            'statements': [
                {'text': 'OAuth 2.0 is an authorization framework, not authentication.', 'correct': True},
                {'text': 'Storing passwords in plain text is acceptable for internal tools.', 'correct': False},
                {'text': 'HTTPS should be used for all API communications.', 'correct': True},
                {'text': 'JWT tokens never expire and can be reused indefinitely.', 'correct': False}
            ],
            'passThreshold': 75
        },
        9: {  # Scalability -> Scenario
            'type': 'scenario',
            'scenario': 'Your e-commerce site crashes during Black Friday traffic spikes. Normal load is 100 requests/second. During sales, it hits 10,000 requests/second.',
            'question': 'Which architectural change addresses the root cause?',
            'options': ['Buy the most expensive server available', 'Implement auto-scaling and CDN caching', 'Block traffic during peak hours', 'Move to a bigger data center'],
            'correct': 1,
            'explanation': 'Auto-scaling handles traffic spikes dynamically. CDN caching reduces origin server load for static content.'
        }
    },
    'enterprise-deployment': {
        1: {  # Deployment Strategies -> Matching
            'type': 'matching',
            'pairs': [
                {'left': 'Blue-Green', 'right': 'Two identical environments, instant switch'},
                {'left': 'Canary', 'right': 'Gradual rollout to subset of users'},
                {'left': 'Rolling', 'right': 'Replace instances one by one'},
                {'left': 'A/B Testing', 'right': 'Compare versions with real users'}
            ]
        },
        3: {  # CI/CD Pipelines -> Sequencing
            'type': 'sequencing',
            'instruction': 'Order the CI/CD pipeline stages.',
            'items': [
                'Code commit triggers the pipeline',
                'Automated tests run (unit, integration)',
                'Build artifacts are created',
                'Security scanning checks for vulnerabilities',
                'Deployment to staging environment',
                'Manual approval for production deployment',
                'Deployment to production with monitoring'
            ],
            'correctOrder': [0, 1, 2, 3, 4, 5, 6]
        },
        5: {  # Monitoring -> True/False
            'type': 'truefalse',
            'statements': [
                {'text': 'SLA defines the minimum acceptable uptime percentage.', 'correct': True},
                {'text': 'SLI is the business agreement with customers.', 'correct': False},
                {'text': 'SLO is the target reliability goal.', 'correct': True},
                {'text': 'Alert fatigue occurs when teams receive too many non-actionable alerts.', 'correct': True}
            ],
            'passThreshold': 75
        },
        7: {  # Security Compliance -> Fill in the blanks
            'type': 'fillblank',
            'instruction': 'Complete the security compliance terms.',
            'text': 'SOC 2 Type II assesses security controls over a period of {blank} months. {blank} is the principle of giving users only the access they need. Data {blank} ensures sensitive information is unreadable without keys.',
            'answers': [['6', 'six'], ['Least privilege', 'least privilege'], ['encryption']]
        },
        9: {  # Disaster Recovery -> Scenario
            'type': 'scenario',
            'scenario': 'Your primary data center experiences a power failure. Your RPO is 1 hour and RTO is 4 hours. The backup generator fails to start.',
            'question': 'What should be your immediate next step?',
            'options': ['Wait for the generator to be fixed', 'Fail over to the secondary region immediately', 'Start manually copying data from the last backup', 'Announce a maintenance window to customers'],
            'correct': 1,
            'explanation': 'With an RTO of 4 hours, failing over to the secondary region is the fastest way to restore service. Waiting risks exceeding the RTO.'
        }
    }
}


def replace_quiz_with_assessment(content, seg_idx, assessment):
    """Replace quiz array with assessment object in a segment."""
    # Find the segment by title/index pattern
    # We need to find the quiz array and replace it
    
    # Pattern to find quiz array after a segment's content
    quiz_pattern = rf'(title:\s*"[^"]+",\s*content:.*?quiz:\s*\[)(.*?)(\],\s*passThreshold)'
    
    # Since regex on nested structures is fragile, let's use a different approach
    # We'll replace specific quiz blocks based on the segment index
    
    # Find all quiz blocks
    quiz_blocks = list(re.finditer(r'quiz:\s*\[.*?\],\s*passThreshold:\s*\d+', content, re.DOTALL))
    
    if seg_idx < len(quiz_blocks):
        block = quiz_blocks[seg_idx]
        start, end = block.start(), block.end()
        
        # Build replacement assessment
        assessment_str = f'assessment: {json.dumps(assessment, ensure_ascii=False)}'
        # Replace quiz: [...], passThreshold: N with assessment: {...}
        new_content = content[:start] + assessment_str + content[end:]
        return new_content
    
    return content


def process_course_file(filepath, course_id):
    """Process a single course file to add assessment variety."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    assessments = course_assessments.get(course_id, {})
    if not assessments:
        print(f"  No assessments defined for {course_id}")
        return False
    
    # Process from highest index to lowest to preserve positions
    for seg_idx in sorted(assessments.keys(), reverse=True):
        assessment = assessments[seg_idx]
        content = replace_quiz_with_assessment(content, seg_idx, assessment)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"  Updated {len(assessments)} segments with varied assessments")
    return True


# Course ID to filename mapping
course_files = {
    'ai-brain': 'course-ai-brain.html',
    'avatar-foundations': 'course-avatar-foundations.html',
    'ai-coding': 'course-ai-coding.html',
    'sales-marketing': 'course-sales-marketing.html',
    'personal-productivity': 'course-personal-productivity.html',
    'one-person-company': 'course-one-person-company.html',
    'business-automation': 'course-business-automation.html',
    'solution-architecture': 'course-solution-architecture.html',
    'enterprise-deployment': 'course-enterprise-deployment.html'
}

base_path = '/home/node/.openclaw/workspace/zetrixavatar'

for course_id, filename in course_files.items():
    filepath = f"{base_path}/{filename}"
    print(f"Processing {filename}...")
    try:
        process_course_file(filepath, course_id)
    except Exception as e:
        print(f"  ERROR: {e}")

print("\nDone! Review the changes before committing.")
