import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  title: string;
}

class CreateTransactionService {
  public async execute({ title }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);
    const formatedTitle = title[0].toUpperCase() + title.slice(1);

    const categoryExists = await categoryRepository.findOne({
      where: {
        title: formatedTitle,
      },
    });

    if (categoryExists) {
      return categoryExists;
    }

    const category = categoryRepository.create({
      title: formatedTitle,
    });

    await categoryRepository.save(category);

    return category;
  }
}

export default CreateTransactionService;
