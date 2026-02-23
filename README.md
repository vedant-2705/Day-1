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

---

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