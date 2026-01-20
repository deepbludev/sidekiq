# Developer Profile & Preferences

## Role & Technical Background
- **Primary Role**: Software Engineer/Developer
- **Tech Stack**:
  - JavaScript/TypeScript (React, Node.js)
  - Python (Django, Flask, FastAPI)

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
- **Preference**: Comprehensive - JSDoc/docstrings
- Add full documentation for functions and modules
- Use JSDoc for JavaScript/TypeScript
- Use docstrings for Python
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
   - Avoid `any` types unless absolutely necessary

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
