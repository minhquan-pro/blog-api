#!/bin/bash

# Script to commit Blog-api changes by feature/functionality
# This script automatically stages and commits changes in logical groups

set -e

echo "=== Starting feature-based commits for Blog-api ==="
echo ""

# Helper function to commit changes
commit_changes() {
    local commit_msg=$1
    shift
    local files=("$@")
    
    if [ ${#files[@]} -eq 0 ]; then
        echo "❌ No files provided for commit"
        return
    fi
    
    echo "📝 Committing: $commit_msg"
    echo "   Files: ${files[@]}"
    
    git add "${files[@]}"
    git commit -m "$commit_msg"
    
    echo "✅ Committed successfully"
    echo ""
}

# 1. Database schema and migrations
echo "🗄️  Step 1: Database schema and migrations"
commit_changes \
    "feat: update database schema - add user admin and lock status" \
    prisma/schema.prisma \
    prisma/migrations/20260414040807_add_user_is_admin/ \
    prisma/migrations/20260415000000_add_user_is_locked/ \
    prisma/migrations/migration_lock.toml \
    "src/generated/prisma/models/User.ts" \
    "src/generated/prisma/commonInputTypes.ts" \
    "src/generated/prisma/internal/class.ts" \
    "src/generated/prisma/internal/prismaNamespace.ts" \
    "src/generated/prisma/internal/prismaNamespaceBrowser.ts"

# 2. Dependencies and configuration
echo "📦 Step 2: Update dependencies and configuration"
commit_changes \
    "chore: update dependencies and project configuration" \
    package.json \
    package-lock.json \
    .gitignore

# 3. Core library utilities
echo "🔧 Step 3: Core library utilities and types"
commit_changes \
    "refactor: update domain types and mappers" \
    src/lib/domain.ts \
    src/lib/mappers.ts

# 4. Admin infrastructure
echo "🛡️  Step 4: Add admin infrastructure - middleware and utilities"
commit_changes \
    "feat: add admin middleware and utilities" \
    src/middleware/require-admin.ts \
    src/middleware/require-unlocked.ts \
    src/lib/user-lock.ts \
    src/lib/admin-helpers.ts

# 5. Core app and middleware updates
echo "⚙️  Step 5: Update core application and middleware"
commit_changes \
    "feat: integrate admin middleware into application core" \
    src/app.ts \
    src/middleware/error-handler.ts

# 6. Authentication controller and service
echo "🔐 Step 6: Authentication system"
commit_changes \
    "feat: add authentication controller and service" \
    src/controllers/auth.controller.ts \
    src/services/auth.service.ts \
    src/routes/auth.ts

# 7. User profile endpoints (Me)
echo "👤 Step 7: User profile endpoints"
commit_changes \
    "feat: add user profile controller and service" \
    src/controllers/me.controller.ts \
    src/services/me.service.ts \
    src/routes/me.ts

# 8. User management
echo "👥 Step 8: User management system"
commit_changes \
    "feat: add user management controller and service" \
    src/controllers/users.controller.ts \
    src/services/users.service.ts

# 9. Admin users management
echo "👨‍💼 Step 9: Admin user management system"
commit_changes \
    "feat: add admin user management controller and service" \
    src/controllers/admin-users.controller.ts \
    src/services/admin-users.service.ts

# 10. Posts management
echo "📝 Step 10: Posts management system"
commit_changes \
    "feat: add posts controller and service" \
    src/controllers/posts.controller.ts \
    src/services/posts.service.ts \
    src/routes/posts.ts

# 11. Admin posts management
echo "📝 Step 11: Admin posts management system"
commit_changes \
    "feat: add admin posts controller and service" \
    src/controllers/admin-posts.controller.ts \
    src/services/admin-posts.service.ts

# 12. Publications management
echo "📚 Step 12: Publications management system"
commit_changes \
    "feat: add publications controller and service" \
    src/controllers/publications.controller.ts \
    src/services/publications.service.ts \
    src/routes/publications.ts

# 13. Admin publications management
echo "📚 Step 13: Admin publications management system"
commit_changes \
    "feat: add admin publications controller and service" \
    src/controllers/admin-publications.controller.ts \
    src/services/admin-publications.service.ts

# 14. Tags management
echo "🏷️  Step 14: Tags management system"
commit_changes \
    "feat: add tags controller and service" \
    src/controllers/tags.controller.ts \
    src/services/tags.service.ts \
    src/routes/tags.ts

# 15. Admin tags management
echo "🏷️  Step 15: Admin tags management system"
commit_changes \
    "feat: add admin tags controller and service" \
    src/controllers/admin-tags.controller.ts \
    src/services/admin-tags.service.ts

# 16. Comments management
echo "💬 Step 16: Comments management system"
commit_changes \
    "feat: add comments controller and service" \
    src/controllers/admin-comments.controller.ts \
    src/services/admin-comments.service.ts

# 17. Engagement metrics
echo "📊 Step 17: Engagement and analytics system"
commit_changes \
    "feat: add engagement controller and dashboard service" \
    src/controllers/admin-engagement.controller.ts \
    src/services/admin-engagement.service.ts

# 18. Admin dashboard
echo "📊 Step 18: Admin dashboard system"
commit_changes \
    "feat: add admin dashboard controller and service" \
    src/controllers/admin-dashboard.controller.ts \
    src/services/admin-dashboard.service.ts

# 19. Admin routes
echo "🛣️  Step 19: Admin routing system"
commit_changes \
    "feat: add comprehensive admin routing endpoints" \
    src/routes/admin.ts

# 20. File uploads
echo "📤 Step 20: File upload system"
commit_changes \
    "feat: add file uploads controller and routing" \
    src/controllers/uploads.controller.ts \
    src/routes/uploads.ts \
    uploads/

# 21. Tests
echo "🧪 Step 21: Update API tests"
commit_changes \
    "test: update integration tests for new features" \
    tests/api.integration.test.ts

# 22. Documentation
echo "📖 Step 22: Add API documentation"
commit_changes \
    "docs: add comprehensive API documentation" \
    docs/

echo ""
echo "=== ✅ All commits completed successfully ==="
echo ""
echo "Verifying commit history..."
git log --oneline -22

