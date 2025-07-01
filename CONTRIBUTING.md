# Contributing to Lunara

Thank you for your interest in contributing to Lunara! This document provides guidelines and information for contributors.

## 🎯 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **🐛 Bug Reports**: Help us identify and fix issues
- **✨ Feature Requests**: Suggest new features or improvements
- **💻 Code Contributions**: Submit bug fixes, features, or optimizations
- **📚 Documentation**: Improve docs, tutorials, and code comments
- **🎨 Design**: UI/UX improvements, icons, and visual assets
- **🧪 Testing**: Write tests, improve test coverage
- **🌐 Translations**: Add support for new languages

### Before You Start

1. **Check existing issues** to avoid duplicate work
2. **Search discussions** for ongoing conversations about your idea
3. **Read this guide** completely to understand our process
4. **Set up the development environment** following the README

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git
- Your favorite code editor (VS Code recommended)

### Local Setup

1. **Fork and clone**
   ```bash
   git fork https://github.com/Celestial-0/Lunara.git
   git clone https://github.com/your-username/Lunara.git
   cd Lunara
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Fill in your environment variables
   ```

4. **Set up database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## 📝 Contribution Guidelines

### Code Style

- **TypeScript**: Use strict TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Code formatting is handled by ESLint
- **File Naming**: Use kebab-case for files, PascalCase for components
- **Imports**: Use absolute imports with `@/` prefix

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring without functionality changes
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```bash
feat(voice): add speech recognition error handling
fix(auth): resolve Google OAuth redirect issue
docs(readme): update installation instructions
style(chat): improve message bubble styling
refactor(api): optimize database queries
test(voice): add voice chat integration tests
chore(deps): update dependencies to latest versions
```

### Branch Naming

Use descriptive branch names:
- `feature/voice-chat-improvements`
- `fix/authentication-redirect-bug`
- `docs/api-documentation-update`
- `refactor/database-query-optimization`

## 🔄 Pull Request Process

### Before Submitting

1. **Test your changes** thoroughly
2. **Run linting** with `npm run lint`
3. **Update documentation** if needed
4. **Add tests** for new features
5. **Ensure build passes** with `npm run build`

### PR Description Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Unit tests added/updated
- [ ] Integration tests pass

## Screenshots
Include screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks** must pass (linting, build, tests)
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** and merge by maintainers

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- MessageBubble.test.tsx
```

### Writing Tests

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows

### Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    render(
      <MessageBubble
        message={{
          id: '1',
          content: 'Hello world',
          role: 'user',
          createdAt: new Date(),
        }}
      />
    );
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
```

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Update to latest version** to see if bug persists
3. **Test in different browsers** if applicable
4. **Gather relevant information** about your environment

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Screenshots
Add screenshots if applicable.

## Environment
- OS: [e.g. Windows 10, macOS]
- Browser: [e.g. Chrome 91, Firefox 89]
- Node.js: [e.g. 18.17.0]
- Database: [e.g. PostgreSQL 14]

## Additional Context
Any other relevant information.
```

## ✨ Feature Requests

### Before Requesting

1. **Check roadmap** to see if feature is planned
2. **Search discussions** for similar requests
3. **Consider scope** and alignment with project goals

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature.

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches you've considered.

## Additional Context
Mockups, examples, or references.
```

## 🏗️ Architecture Guidelines

### Component Structure

```typescript
// Component file structure
import { ComponentProps } from './Component.types';
import { useComponent } from './Component.hooks';
import './Component.styles.css';

export function Component({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### File Organization

```
components/
├── ComponentName/
│   ├── index.ts              # Export file
│   ├── ComponentName.tsx     # Main component
│   ├── ComponentName.types.ts # Type definitions
│   ├── ComponentName.hooks.ts # Custom hooks
│   ├── ComponentName.test.tsx # Tests
│   └── ComponentName.stories.tsx # Storybook (if applicable)
```

### State Management

- **Local state**: Use `useState` for component-specific state
- **Global state**: Use Zustand store for app-wide state
- **Server state**: Use proper caching and invalidation
- **Form state**: Use React Hook Form for complex forms

## 📚 Documentation Guidelines

### Code Documentation

- **JSDoc comments** for functions and components
- **Inline comments** for complex logic
- **README updates** for new features
- **Type definitions** with descriptive names

### Documentation Style

```typescript
/**
 * Processes voice input and generates AI response
 * @param input - The voice input text from speech recognition
 * @param personality - AI personality setting for response style
 * @returns Promise that resolves to the AI response
 * @throws {Error} When API request fails or input is invalid
 */
async function processVoiceInput(
  input: string,
  personality: AIPersonality
): Promise<string> {
  // Implementation
}
```

## 🎯 Focus Areas for Contributors

### High Priority
- **Performance optimizations** for real-time features
- **Accessibility improvements** for voice and chat interfaces
- **Mobile experience** enhancements
- **Error handling** and user feedback
- **Testing coverage** improvements

### Medium Priority
- **New AI personalities** and conversation styles
- **UI/UX improvements** and animations
- **Voice quality enhancements**
- **Internationalization** support
- **Integration testing** for API endpoints

### Future Enhancements
- **WebRTC implementation** for direct voice calls
- **File sharing** capabilities
- **Plugin architecture** for extensibility
- **Advanced analytics** and insights
- **Team collaboration** features

## 🤝 Community Guidelines

### Be Respectful
- Use inclusive and welcoming language
- Respect different viewpoints and experiences
- Focus on constructive feedback
- Help newcomers get started

### Stay On Topic
- Keep discussions relevant to the project
- Use appropriate channels (issues vs discussions)
- Search before posting to avoid duplicates

### Quality Standards
- Provide clear, detailed information
- Include relevant context and examples
- Test thoroughly before submitting
- Follow established patterns and conventions

## 📞 Getting Help

### Where to Ask
- **🐛 Bugs**: Create an issue with the bug template
- **✨ Features**: Start a discussion in the Ideas category
- **❓ Questions**: Use GitHub Discussions Q&A
- **💬 Chat**: Join our community discussions

### Response Times
- **Issues**: We aim to respond within 48 hours
- **PRs**: Reviews typically happen within 1 week
- **Discussions**: Community members usually respond quickly

## 🎉 Recognition

Contributors are recognized through:
- **Credits** in release notes
- **Contributor badge** on GitHub profile
- **Mention** in project documentation
- **Invitation** to maintainer team for significant contributions

---

Thank you for contributing to Lunara! Together, we're building the future of AI conversation. 🚀
