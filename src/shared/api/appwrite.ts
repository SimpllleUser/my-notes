import { Client, Account, ID, Databases } from 'appwrite'


const client = new Client()
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)

export const account = new Account(client)
export const databases = new Databases(client)

// const result = await databases.createDocument({
//   databaseId: import.meta.env.APPWRITE_DATABASE_ID,
//   collectionId: import.meta.env.APPWRITE_COLLECTION_FOLDER_ID,
//   documentId: '<DOCUMENT_ID>',
//   data: {
//     username: 'walter.obrien',
//     email: 'walter.obrien@example.com',
//     fullName: "Walter O'Brien",
//     age: 30,
//     isAdmin: false,
//   },
//   // permissions: [Permission.read(Role.any())], // optional
// })

// try {
//   const user = await account.create({
//     userId: '[USER_ID]',
//     email: 'email@example.com',
//     password: '<Password>',
//   })
//   console.log(user)
// } catch (e) {
//   console.error(e)
// }
