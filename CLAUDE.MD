# Developer Profile & Preferences

## Product Overview
- **Product Name**: Sidekiq
- **Description**: Sidekiq is a premium AI chat application designed to replicate functionality of traditional AI chat apps, such as ChatGPT, Claude, Gemini, etc. in an agnostic way where users can choose the underlying model provider (similar to [t3.chat](https://t3.chat)). It also includes a robust custom assistant feature similar to OpenAI's GPTs or Google's Gems. These custom assistants, called **"Sidekiq"**, allow users to configure specialized AI personas with specific instructions, names, and descriptions. The goal is to provide a "wow" user experience with high-end, modern and clean aesthetics, a snappy UI and UX, while maintaining a solid, type-safe full-stack architecture.
- **Features**:
  - AI chat functionality with multiple model providers.
  - Sidekiqs: Custom assistants with specific instructions, names, and descriptions (similar to OpenAI's GPTs or Google's Gems).
  - Team functionality with shared chats and Sidekiqs.
  - Settings panel for managing users, teams, chats and Sidekiqs.
  - Payment functionality with Stripe.
  
## Role & Technical Background
- **Primary Role**: Fullstack Software Engineer/Developer
- **Tech Stack**:
  - JavaScript/TypeScript (Next.js, tailwindcss, Zod, Tanstack Query)
  - PostgreSQL
  - Redis
  - Railway + Docker for deployment
  - Docker Compose for local development
  - Github Actions CI/CD

## Communication & Explanation Style
- **Tone**: Professional and technical
- **Explanation Depth**: Balanced - Brief context with code (Recommended)
  - Provide quick explanation of approach before implementation
  - Focus on clarity without over-explaining
  - Keep commentary concise and relevant

## Code Quality & Standards

### Testing Approach
- **Strategy**: Suggest tests, let me decide
- Recommend testing approaches when implementing features
- Wait for approval before writing tests
- Provide clear rationale for suggested test coverage

### Documentation Style
- **Preference**: Comprehensive - JSDoc
- Add full documentation for functions and modules
- Use JSDoc for JavaScript/TypeScript
- Document parameters, return values, and usage examples

### Architectural Decisions
- **Approach**: Suggest best practices proactively
- Recommend improvements while implementing
- Present architectural options when relevant
- Balance best practices with practical constraints

## Development Priorities
The following practices are critical and should be emphasized:

1. **Type Safety & Strict Typing**
   - Use TypeScript strict mode when applicable
   - Add comprehensive type annotations
   - Use runtime validators (Zod) for all inputs and outputs and leverage them for type inference.
   - Avoid `any` types unless absolutely necessary. Prefer `unknown`  type for unknown values.

2. **Performance Optimization**
   - Focus on efficient algorithms
   - Consider resource usage and scalability
   - Profile and optimize critical paths

3. **Code Simplicity & Readability**
   - Prioritize clean, maintainable code over clever solutions
   - Use clear naming conventions
   - Avoid premature abstraction

4. **Security Best Practices**
   - Emphasize secure coding patterns
   - Implement proper input validation
   - Follow OWASP guidelines
   - Prevent common vulnerabilities (XSS, injection, etc.)

## Error Handling Philosophy
- **Style**: Practical error handling only
- Handle likely errors and edge cases
- Validate at system boundaries (user input, external APIs)
- Skip defensive coding for impossible scenarios
- Trust internal code and framework guarantees

## Git Workflow
- **Commit Style**: Conventional commits format
- Use structured commit types:
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `refactor:` - Code refactoring
  - `docs:` - Documentation changes
  - `test:` - Test additions/changes
  - `chore:` - Maintenance tasks
- Write clear, descriptive commit messages
- Focus on the "why" rather than the "what"

## Task Management
- **TodoWrite Usage**: Always - Track all multi-step tasks
- Use todos for organization and visibility
- Create task lists for any work with 3+ steps
- Mark tasks as in_progress and completed in real-time
- Provide clear visibility into progress

## Tool & Library Preferences
- **Default Approach**: I'll specify per-project
- No blanket preference for cutting-edge vs. stable
- Ask for guidance when technology choices are needed
- Adapt to project-specific requirements

## Additional Notes
- Avoid over-engineering - implement what's requested
- Don't add unrequested features or "improvements"
- Keep solutions simple and focused
- Balance theoretical best practices with practical delivery
