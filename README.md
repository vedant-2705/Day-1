# Day 1 : Routing, Controllers, Validations, Config Management
 
### Topics to learn:
- Routing
- Layered architecture (Controller -> Service -> Repo)
- Validation (manual + library like Zod/Joi)
- Serialization/Deserialization
- ENV-based config setup
- Request lifecycle

### Practical tips:
- Use concepts you learned in previous training
- Create clean folder structure 
- Add custom validation layer  
- Add global config loader with environment switching


### Assignment:

Build a mini User Contact Book API
Must include:

1. CRUD for contacts (name, email, phone, address)
2. Strict validation using Zod/Joi
3. Custom JSON serializer (remove internal fields before returning)
4. ENV-based config (dev, stage, prod)
5. Middleware for logging request + execution time
6. Error classes + unified response format
7. Controller -> service -> repo architecture (mandatory)

---

# Day 2 REST, Error Handling, Pagination & Versioning
 
Topics
* REST conventions
* Error handling architecture
* Pagination strategies
* Cursor-based paging
* Versioning
* Practical tips Implement cursor pagination  
* Create error middleware with error codes

### Assignment
 
Extend Contact Book into “CRM Lite”:
 
1. Create v1 and v2 versions 
2. In v2, implement pagination 
3. Add search + filter (by name, email) 
4. Add sorting with multiple sort fields 
5. Add audit logs (store in DB): every update/delete must log old+new data 
6. Create a /reports/contacts-stats API:     
   - total contacts     
   - contacts added today     
   - most common domain (gmail/yahoo/outlook)

---

# Day 3 : Authentication, Authorization, JWT, Tokens
 
Topics
- JWT access + refresh
- Roles/permissions
- Password hashing
 
Practical Tips
- Build login + register  
- Role-based middleware
 
### Assignment:
 
Add full authentication system to CRM Lite:
 
1. Register/Login with password hashing
2. Access + Refresh tokens (store in DB)
3. Secure refresh token rotation
4. Role-based routes:
   - admin can see all contacts
   - normal user sees only his own
5. Add session invalidation endpoint: logout from all devices

---

# Day 4 File Uploads + Swagger
 
Topics
File uploads (images, docs)
Multipart handling
Swagger documentation
Folder storage strategy
 
Practical tips
Add Swagger UI  
Upload profile picture for each user
 
### Assignment:
 
Build fully documented Upload Service: (Cloudinary + Local)
 
1. /upload/profile (image only)
2. /upload/document (pdf/doc only)
3. Validate file type + size
4. Generate dynamic folder structure
5. Add retry logic + error handling
6. Add Swagger docs for every route including error schemas