const mapUserRow = (row) =>
  row
    ? {
        userId: row.user_id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        dob: row.dob,
        subscription: row.subscription,
        profileImageUrl: row.profile_image_url,
        followersCount: row.followers_count,
        followingCount: row.following_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;

export const findUserByEmail = async (executor, email) => {
  const result = await executor.query(
    `
      SELECT *
      FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [email]
  );

  return mapUserRow(result.rows[0]);
};

export const findUserByUsername = async (executor, username) => {
  const result = await executor.query(
    `
      SELECT *
      FROM users
      WHERE lower(username) = lower($1)
      LIMIT 1
    `,
    [username]
  );

  return mapUserRow(result.rows[0]);
};

export const findUserById = async (executor, userId) => {
  const result = await executor.query(
    `
      SELECT *
      FROM users
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  return mapUserRow(result.rows[0]);
};

export const createUser = async (executor, { username, email, passwordHash, dob }) => {
  const result = await executor.query(
    `
      INSERT INTO users (username, email, password_hash, dob)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [username, email, passwordHash, dob || null]
  );

  return mapUserRow(result.rows[0]);
};

export const insertPhoneNumbers = async (executor, userId, phones) => {
  if (!phones.length) {
    return [];
  }

  const values = [];
  const placeholders = phones
    .map((phone, index) => {
      const offset = index * 2;
      values.push(userId, phone);
      return `($${offset + 1}, $${offset + 2})`;
    })
    .join(", ");

  await executor.query(
    `
      INSERT INTO user_phone_numbers (user_id, phone_no)
      VALUES ${placeholders}
      ON CONFLICT (user_id, phone_no) DO NOTHING
    `,
    values
  );
};

export const updatePasswordHash = async (executor, userId, passwordHash) => {
  await executor.query(
    `
      UPDATE users
      SET password_hash = $2
      WHERE user_id = $1
    `,
    [userId, passwordHash]
  );
};
