import { trpc, queryClient } from "@/integrations/tanstack-query/root-provider";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import type{ SupportedMimeType } from "@athena-ai/server/types";

export type UploadCompletePayload = {
	title: string;
	description: string;
	fileSize: number;
	tags?: string[];
	uploadLink: string;
};

export function useUploadLibraryItem({
	onComplete,
	close,
}: {
	onComplete?: (payload: UploadCompletePayload) => void;
	close?: () => void;
}) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	const createItemMutation = useMutation({
		...trpc.library.createLibraryItem.mutationOptions(),
	});

	async function handleUploadSubmit({
		file,
		title,
		description,
		tags,
	}: {
		file: File;
		title: string;
		description: string;
		tags: string[];
	}) {
		try {
			setIsSubmitting(true);
			abortControllerRef.current = new AbortController();
			const key = `${Date.now()}-${file.name}`;
			// Validate and get MIME type
			const validMimeTypes: SupportedMimeType[] = [
				'application/pdf',
				'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'text/markdown',
				'text/plain',
				'text/csv',
				'application/vnd.oasis.opendocument.text',
			];
			
			if (!validMimeTypes.includes(file.type as SupportedMimeType)) {
				throw new Error("Unsupported file type. Please upload PDF, DOC, DOCX, TXT, MD, CSV, or ODT files");
			}

			const presigned = await queryClient.ensureQueryData(
				trpc.library.getPresignedUrl.queryOptions({
					key,
					contentType: file.type as SupportedMimeType,
				})
			);

			// Upload file with abort capability
			await axios.put(presigned.uploadUrl, file, {
				headers: { "Content-Type": file.type },
				signal: abortControllerRef.current.signal,
			});

			const fileSize = file.size;
			const created = await createItemMutation.mutateAsync({
				title,
				description,
				uploadLink: presigned.objectKey,
				fileSize,
				tags: tags ?? [],
			});

			// Optimistically reflect new processing item in cache
			queryClient.setQueryData(trpc.library.getLibraryItems.queryKey(), (prev: any) => {
				const optimistic = {
					id: created?.[0]?.id ?? Date.now().toString(),
					title,
					description,
					uploadLink: presigned.objectKey,
					fileSize,
					tags: tags ?? [],
					createdAt: new Date().toISOString(),
					status: "processing",
				};
				if (!Array.isArray(prev)) return [optimistic];
				return [...prev, optimistic];
			});

			onComplete?.({
				title,
				description,
				fileSize,
				tags,
				uploadLink: presigned.objectKey,
			});

			await queryClient.invalidateQueries({
				queryKey: trpc.library.getLibraryItems.queryKey(),
			});

			close?.();
		} catch (e) {
			if (e instanceof AxiosError) {
				const message = e.message;
				toast.error(message);
				throw e;
			}
			const message = e instanceof Error ? e.message : "Upload failed";
			toast.error(message);
			throw e;
		} finally {
			setIsSubmitting(false);
			abortControllerRef.current = null;
		}
	}

	function abortUpload() {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
			setIsSubmitting(false);
			toast.info("Upload cancelled");
		}
	}

	function resetState() {
		// reserved for future external resets
	}

	return { isSubmitting, handleUploadSubmit, abortUpload, resetState };
}


